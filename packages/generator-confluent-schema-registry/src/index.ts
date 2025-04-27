import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';
import checkLicense from './checkLicense';
import { filterSchemas } from './utils/filters';
import pkgJSON from '../package.json';
import path, { join } from 'path';
import { EventCatalogConfig, GeneratorProps, Schema } from './types';
import { getSchemasFromRegistry, getLatestVersionFromSubject } from './lib/confluent';
import { writeTopicToEventCatalog } from './utils/topics';

/////////////////////////////////////////////////

export default async (config: EventCatalogConfig, options: GeneratorProps) => {
  const SCHEMA_REGISTRY_URL = options.url;
  const INCLUDE_ALL_VERSIONS = options.includeAllVersions;

  if (!process.env.PROJECT_DIR) {
    process.env.PROJECT_DIR = process.cwd();
  }

  if (!SCHEMA_REGISTRY_URL) {
    throw new Error('Please provide a url for the Confluent Schema Registry');
  }

  // This is set by EventCatalog. This is the directory where the catalog is stored
  const eventCatalogDirectory = process.env.PROJECT_DIR;

  if (!eventCatalogDirectory) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  const { writeService, getService, versionService, getDomain, versionDomain, writeDomain, addServiceToDomain } =
    utils(eventCatalogDirectory);

  // Check for license and package update
  await checkLicense(options.licenseKey);
  await checkForPackageUpdate(pkgJSON.name);

  console.log(chalk.green(`Fetching schemas from registry: ${SCHEMA_REGISTRY_URL}...`));
  const schemas = await getSchemasFromRegistry(SCHEMA_REGISTRY_URL, {
    username: process.env.CONFLUENT_SCHEMA_REGISTRY_KEY || '',
    password: process.env.CONFLUENT_SCHEMA_REGISTRY_SECRET || '',
  });

  console.log(chalk.green(`Found ${schemas.length} schemas in Confluent Schema Registry`));

  // group them by subject
  const groupedSchemas = schemas.reduce((acc: Record<string, Schema[]>, schema: Schema) => {
    acc[schema.subject] = [...(acc[schema.subject] || []), { ...schema, eventId: schema.subject.replace('-value', '') }];
    return acc;
  }, {});

  console.log(chalk.green(`Fetching latest version for each topic...`));
  // Get the latest version for each subject (schema), and hydrate the latestVersion property
  for (const subject in groupedSchemas) {
    const latestVersion = await getLatestVersionFromSubject(options.url, subject);
    // Find the schema in the array that has the same id as the latestVersion.id
    const schema = groupedSchemas[subject].find((s: Schema) => s.version === latestVersion.version);
    if (schema) {
      schema.latestVersion = true;
    }
  }

  const allTopicsInSchemaRegistry = Object.keys(groupedSchemas);

  // Document all the services
  const services = options.services || [];
  const documentTopicsWithServices = services.length > 0;

  // Create/manage domain if one is configured
  if (options.domain) {
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
      await writeDomain({
        id: domainId,
        name: domainName,
        version: domainVersion,
        markdown: '',
      });
      console.log(chalk.cyan(` - Domain (v${domainVersion}) created`));
    }

    //  Add all the services to the domain
    for (const service of services) {
      await addServiceToDomain(domainId, { id: service.id, version: service.version }, domainVersion);
    }
  }

  if (documentTopicsWithServices) {
    for (const service of services) {
      // Try and find the given topics to match against the service
      const sends = filterSchemas(groupedSchemas, service.sends || []).filter((topic) => topic !== undefined);
      const receives = filterSchemas(groupedSchemas, service.receives || []).filter((topic) => topic !== undefined);

      const serviceInCatalog = await getService(service.id);
      const { sends: previousSends, receives: previousReceives, ...previousServiceInformation } = serviceInCatalog || {};

      if (serviceInCatalog && serviceInCatalog.version !== service.version) {
        // If the versions match, remove it as we are going to update/rewrite it with persisted information
        await versionService(service.id);
        console.log(chalk.cyan(` - Versioned previous service: (v${serviceInCatalog.version})`));
      }

      // Path to service
      const pathToService = join('../', 'services', service.id);
      const serviceToWrite = {
        // Persist if we have previous information
        ...previousServiceInformation,

        // Regardless if we have previous information or not, we add this information always
        id: service.id,
        name: service.id,
        version: service.version,
        ...(sends.length > 0 ? { sends: sends.map((topic) => ({ id: topic.eventId, version: topic.version.toString() })) } : {}),
        ...(receives.length > 0
          ? { receives: receives.map((topic) => ({ id: topic.eventId, version: topic.version.toString() })) }
          : {}),

        // If the service does not already exist we need to add fields for new documented topics
        ...(!serviceInCatalog
          ? {
              markdown: '',
              summary: '',
            }
          : {}),
      };

      let servicePath = options.domain ? path.join('../', 'domains', options.domain.id, 'services', service.id) : pathToService;

      await writeService(serviceToWrite, { path: servicePath, override: serviceInCatalog?.version === service.version });

      const topics = [...sends, ...receives];
      for (const topic of topics) {
        await writeTopicToEventCatalog({
          pathToCatalog: eventCatalogDirectory,
          topic,
          rootPath: pathToService,
          serviceId: service.id,
        });
        console.log(chalk.blue(`  - Processed ${topic.eventId} (v${topic.version}), added schema to event catalog`));
      }

      console.log(chalk.blue(`  - Processed ${service.id} (v${service.version}), added service to event catalog`));
    }
  } else {
    // Just document all the topics
    for (const subject of allTopicsInSchemaRegistry) {
      const topics = groupedSchemas[subject];

      const topicsToWriteToEventCatalog = topics.filter((v: Schema) => (INCLUDE_ALL_VERSIONS ? true : v.latestVersion));
      for (const topic of topicsToWriteToEventCatalog) {
        await writeTopicToEventCatalog({
          pathToCatalog: eventCatalogDirectory,
          topic,
          rootPath: '../',
        });
        console.log(chalk.blue(`  - Processed ${topic.eventId} (v${topic.version}), added schema to event catalog`));
      }
    }
  }

  console.log(chalk.green(`\nFinished generating event catalog with Confluent Schema Registry ${SCHEMA_REGISTRY_URL}`));
};
