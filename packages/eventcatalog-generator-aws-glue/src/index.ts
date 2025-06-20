import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { GlueClient, ListSchemasCommand, GetSchemaVersionCommand, GetSchemaCommand, GetTagsCommand } from '@aws-sdk/client-glue';
import { EventCatalogConfig, GlueSchema, GeneratorProps } from './types';
import { filterSchemas } from './utils/filters';
import checkLicense from '../../../shared/checkLicense';

import { defaultMarkdown as generateMarkdownForService } from './utils/services';
import { defaultMarkdown as generateMarkdownForDomain } from './utils/domains';
import { defaultMarkdown as generateMarkdownForMessage, getBadgesForMessage } from './utils/messages';
import path, { join } from 'node:path';
import pkgJSON from '../package.json';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';

const fetchTagsForSchema = async (glueClient: GlueClient, schemaArn: string): Promise<Record<string, string>> => {
  try {
    const getTagsCommand = new GetTagsCommand({
      ResourceArn: schemaArn,
    });
    const response = await glueClient.send(getTagsCommand);
    return response.Tags || {};
  } catch (error) {
    // Tags might not be accessible or the resource might not support tags
    // We'll silently ignore errors and return empty tags
    return {};
  }
};

const fetchSchemasFromRegistry =
  (glueClient: GlueClient) =>
  async (registryName: string, registryArn?: string): Promise<GlueSchema[]> => {
    const schemas = [] as GlueSchema[];
    let nextToken: string | undefined;

    console.log(chalk.green(`Fetching Glue schemas from registry: ${registryName}...`));

    do {
      const listSchemasCommand = new ListSchemasCommand({
        RegistryId: registryArn ? { RegistryArn: registryArn } : { RegistryName: registryName },
        NextToken: nextToken,
      });
      const response = await glueClient.send(listSchemasCommand);

      if (response.Schemas) {
        for (const schema of response.Schemas) {
          if (!schema.SchemaName) {
            console.log(`Skipping schema with no name`);
            continue;
          }

          // Get latest schema version details
          try {
            const getSchemaCommand = new GetSchemaCommand({
              SchemaId: {
                SchemaArn: schema.SchemaArn,
              },
            });
            const schemaDetails = await glueClient.send(getSchemaCommand);

            // Get the latest version of the schema
            const getSchemaVersionCommand = new GetSchemaVersionCommand({
              SchemaId: {
                SchemaArn: schema.SchemaArn,
              },
              SchemaVersionNumber: {
                LatestVersion: true,
              },
            });
            const versionDetails = await glueClient.send(getSchemaVersionCommand);

            if (schemaDetails && versionDetails) {
              // Fetch tags for the schema
              const tags = schema.SchemaArn ? await fetchTagsForSchema(glueClient, schema.SchemaArn) : {};

              schemas.push({
                id: schema.SchemaName!,
                name: schema.SchemaName!,
                registryName: registryName,
                schemaArn: schema.SchemaArn,
                schemaVersionId: versionDetails.SchemaVersionId,
                schemaVersionNumber: versionDetails.VersionNumber,
                dataFormat: versionDetails.DataFormat,
                compatibility: schemaDetails.Compatibility,
                status: versionDetails.Status,
                description: schemaDetails.Description,
                tags: tags,
                createdDate: versionDetails.CreatedTime ? new Date(versionDetails.CreatedTime) : undefined,
                lastUpdated: schema.UpdatedTime ? new Date(schema.UpdatedTime) : undefined,
                schemaDefinition: versionDetails.SchemaDefinition,
                version: versionDetails.VersionNumber?.toString() || '1',
              });
            }
          } catch (error) {
            console.log(`Error fetching details for schema ${schema.SchemaName}:`, error);
            continue;
          }
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return schemas;
  };

export default async (config: EventCatalogConfig, options: GeneratorProps) => {
  if (!process.env.PROJECT_DIR) {
    process.env.PROJECT_DIR = process.cwd();
  }

  // This is set by EventCatalog. This is the directory where the catalog is stored
  const eventCatalogDirectory = process.env.PROJECT_DIR;
  const { services, region, registryName, registryArn } = options;
  const glueClient = new GlueClient({ region, credentials: options.credentials });
  const format = options.format || 'mdx';

  if (!eventCatalogDirectory) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  // Check for license and package update
  const LICENSE_KEY: string = process.env.EVENTCATALOG_LICENSE_KEY_AWS_GLUE_SCHEMA_REGISTRY || options.licenseKey || '';
  await checkLicense(pkgJSON.name, LICENSE_KEY);
  await checkForPackageUpdate(pkgJSON.name);

  // EventCatalog SDK (https://www.eventcatalog.dev/docs/sdk)
  const {
    writeService,
    writeDomain,
    getDomain,
    versionDomain,
    addServiceToDomain,
    getService,
    versionService,
    getSpecificationFilesForService,
    rmServiceById,
  } = utils(eventCatalogDirectory);

  const schemas = await fetchSchemasFromRegistry(glueClient)(registryName, registryArn);

  // If no domain or services, just write all schemas as messages to catalog.
  if (!options.domain && !options.services) {
    await processSchemas(schemas, options);
    return;
  }

  if (!services) {
    throw new Error('Please provide services for your schemas. Please see the generator example and API docs');
  }

  console.log(chalk.green(`Processing ${services.length} services with AWS Glue...`));

  for (const service of services) {
    console.log(chalk.gray(`Processing ${service.id}`));

    let sendsSchemas = [] as GlueSchema[];
    let receivesSchemas = [] as GlueSchema[];

    if (service.sends) {
      sendsSchemas = filterSchemas(schemas, service.sends);
    }

    if (service.receives) {
      receivesSchemas = filterSchemas(schemas, service.receives);
    }

    const schemasToWrite = [...sendsSchemas, ...receivesSchemas];

    // Path to write the service to
    // Have to ../ as the SDK will put the files into hard coded folders
    let servicePath = options.domain
      ? path.join('../', 'domains', options.domain.id, 'services', service.id)
      : path.join('../', 'services', service.id);
    if (options.writeFilesToRoot) {
      servicePath = service.id;
    }

    await processSchemas(schemasToWrite, options, servicePath);

    // Manage domain
    if (options.domain) {
      // Try and get the domain
      const { id: domainId, name: domainName, version: domainVersion } = options.domain;
      const domain = await getDomain(options.domain.id, domainVersion || 'latest');
      const currentDomain = await getDomain(options.domain.id, 'latest');

      console.log(chalk.blue(`\nProcessing domain: ${domainName} (v${domainVersion})`));

      // Found a domain, but the versions do not match
      if (currentDomain && currentDomain.version !== domainVersion) {
        await versionDomain(domainId);
        console.log(chalk.cyan(` - Versioned previous domain (v${currentDomain.version})`));
      }

      // Do we need to create a new domain?
      if (!domain || (domain && domain.version !== domainVersion)) {
        await writeDomain(
          {
            id: domainId,
            name: domainName,
            version: domainVersion,
            markdown: generateMarkdownForDomain(),
          },
          { format }
        );
        console.log(chalk.cyan(` - Domain (v${domainVersion}) created`));
      }

      if (currentDomain && currentDomain.version === domainVersion) {
        console.log(chalk.yellow(` - Domain (v${domainVersion}) already exists, skipped creation...`));
      }

      // Add the service to the domain
      await addServiceToDomain(domainId, { id: service.id, version: service.version }, domainVersion);
    }

    // Check if service is already defined... if the versions do not match then create service.
    const latestServiceInCatalog = await getService(service.id, 'latest');
    let serviceMarkdown = generateMarkdownForService();
    let styles = null;
    let serviceSpecifications = {};
    let serviceSpecificationsFiles = [];
    let sends = sendsSchemas.map((schema) => ({ id: schema.name, version: schema.version || 'latest' }));
    let receives = receivesSchemas.map((schema) => ({
      id: schema.name,
      version: schema.version || 'latest',
    }));
    let owners = [] as any;

    console.log(chalk.blue(`Processing service: ${service.id} (v${service.version})`));

    if (latestServiceInCatalog) {
      serviceMarkdown = latestServiceInCatalog.markdown;
      owners = latestServiceInCatalog.owners || [];
      styles = latestServiceInCatalog.styles || null;
      // Found a service, and versions do not match, we need to version the one already there
      if (latestServiceInCatalog.version !== service.version) {
        await versionService(service.id);
        console.log(chalk.cyan(` - Versioned previous service (v${latestServiceInCatalog.version})`));
      }

      // Match found, override it
      if (latestServiceInCatalog.version === service.version) {
        // we want to preserve the markdown any any spec files that are already there
        serviceMarkdown = latestServiceInCatalog.markdown;
        serviceSpecifications = latestServiceInCatalog.specifications ?? {};
        sends = latestServiceInCatalog.sends ? [...latestServiceInCatalog.sends, ...sends] : sends;
        receives = latestServiceInCatalog.receives ? [...latestServiceInCatalog.receives, ...receives] : receives;
        serviceSpecificationsFiles = await getSpecificationFilesForService(
          latestServiceInCatalog.id,
          latestServiceInCatalog.version
        );
        await rmServiceById(service.id);
      }
    }

    await writeService(
      {
        id: service.id,
        markdown: serviceMarkdown,
        name: service.id,
        version: service.version,
        sends,
        receives,
        specifications: serviceSpecifications,
        owners: owners,
        ...(styles && { styles }),
      },
      { path: servicePath, override: true, format }
    );
  }

  console.log(chalk.green(`\nFinished generating event catalog with AWS Glue Schema Registry ${registryName}`));
};

const processSchemas = async (schemas: GlueSchema[], options: GeneratorProps, servicePath?: string) => {
  // This is set by EventCatalog. This is the directory where the catalog is stored
  const eventCatalogDirectory = process.env.PROJECT_DIR;
  const format = options.format || 'mdx';
  if (!eventCatalogDirectory) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  // EventCatalog SDK (https://www.eventcatalog.dev/docs/sdk)
  const { getEvent, writeEvent, addSchemaToEvent, rmEventById, versionEvent } = utils(eventCatalogDirectory);

  for (const schema of schemas) {
    console.log(chalk.blue(`Processing schema: ${schema.id} (v${schema.version})`));

    let messageMarkdown = generateMarkdownForMessage(schema, options.region);
    const catalogedEvent = await getEvent(schema.id, schema.version);

    if (catalogedEvent) {
      // Persist markdown between versions
      messageMarkdown = catalogedEvent.markdown;

      // if the version matches, we can override the message but keep markdown as it was
      if (catalogedEvent.version === schema.version) {
        await rmEventById(schema.id, schema.version);
      } else {
        // if the version does not match, we need to version the message
        await versionEvent(schema.id);
        console.log(chalk.cyan(` - Versioned previous message: (v${catalogedEvent.version})`));
      }
    }

    // Where to write the event to
    let messagePath = schema.id;

    if (servicePath && !options.writeFilesToRoot) {
      messagePath = join(servicePath, 'events', schema.id);
    }

    await writeEvent(
      {
        id: schema.id,
        name: schema.name,
        version: schema.version?.toString() || '1',
        markdown: messageMarkdown,
        badges: getBadgesForMessage(schema, options.registryName),
      },
      { path: messagePath, format }
    );

    console.log(chalk.cyan(` - Event (${schema.id} v${schema.version}) created`));

    // Add schema definition to the event
    if (schema.schemaDefinition) {
      const schemaFileName =
        schema.dataFormat === 'AVRO'
          ? `${schema.name}-schema.avsc`
          : schema.dataFormat === 'PROTOBUF'
            ? `${schema.name}-schema.proto`
            : `${schema.name}-schema.json`;

      await addSchemaToEvent(schema.id, {
        fileName: schemaFileName,
        schema: schema.schemaDefinition,
      });
      console.log(chalk.cyan(` - Schema added to event (v${schema.version})`));
    }
  }
};
