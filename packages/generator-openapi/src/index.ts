import utils from '@eventcatalog/sdk';
import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import SwaggerParser from '@apidevtools/swagger-parser';

import { defaultMarkdown as generateMarkdownForDomain } from './utils/domains';
import { buildService } from './utils/services';
import { buildMessage } from './utils/messages';
import { getOperationsByType } from './utils/openapi';
import { Domain, Service } from './types';
import { getMessageTypeUtils } from './utils/catalog-shorthand';
import { OpenAPI } from 'openapi-types';
import checkLicense from './utils/checkLicense';
import yaml from 'js-yaml';
import { join } from 'node:path';
import pkgJSON from '../package.json';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';

type MESSAGE_TYPE = 'command' | 'query' | 'event';
export type HTTP_METHOD = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type HTTP_METHOD_TO_MESSAGE_TYPE = Partial<Record<HTTP_METHOD, MESSAGE_TYPE>>;

type Props = {
  services: Service[];
  domain?: Domain;
  debug?: boolean;
  saveParsedSpecFile?: boolean;
  licenseKey?: string;
  writeFilesToRoot?: boolean;
  sidebarBadgeType?: 'HTTP_METHOD' | 'MESSAGE_TYPE';
  httpMethodsToMessages?: HTTP_METHOD_TO_MESSAGE_TYPE;
  preserveExistingMessages?: boolean;
};

export default async (_: any, options: Props) => {
  if (!process.env.PROJECT_DIR) {
    process.env.PROJECT_DIR = process.cwd();
  }

  if (!process.env.PROJECT_DIR) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  // Check if the license is valid
  await checkLicense(options.licenseKey);
  await checkForPackageUpdate(pkgJSON.name);
  const {
    getDomain,
    versionDomain,
    writeDomain,
    addServiceToDomain,
    getService,
    versionService,
    writeService,
    addFileToService,
    getSpecificationFilesForService,
  } = utils(process.env.PROJECT_DIR);

  const { services = [], saveParsedSpecFile = false } = options;
  for (const serviceSpec of services) {
    console.log(chalk.green(`Processing ${serviceSpec.path}`));

    try {
      await SwaggerParser.validate(serviceSpec.path);
    } catch (error) {
      console.error(chalk.red(`Failed to parse OpenAPI file: ${serviceSpec.path}`));
      console.error(chalk.red(error));
      continue;
    }

    const document = await SwaggerParser.dereference(serviceSpec.path);
    const version = document.info.version;

    const service = buildService(serviceSpec, document);
    let serviceMarkdown = service.markdown;
    let serviceSpecificationsFiles = [];
    let serviceSpecifications = service.specifications;

    // Have to ../ as the SDK will put the files into hard coded folders
    let servicePath = options.domain
      ? join('../', 'domains', options.domain.id, 'services', service.id)
      : join('../', 'services', service.id);
    if (options.writeFilesToRoot) {
      servicePath = service.id;
    }

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
        await writeDomain({
          id: domainId,
          name: domainName,
          version: domainVersion,
          markdown: generateMarkdownForDomain(),
          ...(options.domain?.owners ? { owners: options.domain.owners } : {}),
        });
        console.log(chalk.cyan(` - Domain (v${domainVersion}) created`));
      }

      if (currentDomain && currentDomain.version === domainVersion) {
        console.log(chalk.yellow(` - Domain (v${domainVersion}) already exists, skipped creation...`));
      }

      // Add the service to the domain
      await addServiceToDomain(domainId, { id: service.id, version: service.version }, domainVersion);
    }

    // Process all messages for the OpenAPI spec
    let { sends, receives } = await processMessagesForOpenAPISpec(serviceSpec.path, document, servicePath, {
      ...options,
      owners: service.setMessageOwnersToServiceOwners ? service.owners : [],
    });

    let owners = service.owners || [];
    let repository = null;
    let styles = null;

    // Check if service is already defined... if the versions do not match then create service.
    const latestServiceInCatalog = await getService(service.id, 'latest');
    console.log(chalk.blue(`Processing service: ${document.info.title} (v${version})`));

    if (latestServiceInCatalog) {
      serviceMarkdown = latestServiceInCatalog.markdown;
      serviceSpecificationsFiles = await getSpecificationFilesForService(service.id, 'latest');
      sends = latestServiceInCatalog.sends || ([] as any);
      owners = latestServiceInCatalog.owners || ([] as any);
      repository = latestServiceInCatalog.repository || null;
      styles = latestServiceInCatalog.styles || null;
      // persist any specifications that are already in the catalog
      serviceSpecifications = {
        ...serviceSpecifications,
        ...latestServiceInCatalog.specifications,
      };

      // Found a service, and versions do not match, we need to version the one already there
      if (latestServiceInCatalog.version !== version) {
        await versionService(service.id);
        console.log(chalk.cyan(` - Versioned previous service (v${latestServiceInCatalog.version})`));
      }

      // Match found, override it
      if (latestServiceInCatalog.version === version) {
        receives = latestServiceInCatalog.receives ? [...latestServiceInCatalog.receives, ...receives] : receives;
      }
    }

    await writeService(
      {
        ...service,
        markdown: serviceMarkdown,
        specifications: serviceSpecifications,
        sends,
        receives,
        ...(owners ? { owners } : {}),
        ...(repository ? { repository } : {}),
        ...(styles ? { styles } : {}),
      },
      { path: join(servicePath), override: true }
    );

    // What files need added to the service (specification files)
    const specFiles = [
      // add any previous spec files to the list
      ...serviceSpecificationsFiles,
      {
        content: saveParsedSpecFile ? getParsedSpecFile(serviceSpec, document) : await getRawSpecFile(serviceSpec),
        fileName: service.schemaPath,
      },
    ];

    for (const specFile of specFiles) {
      await addFileToService(
        service.id,
        {
          fileName: specFile.fileName,
          content: specFile.content,
        },
        version
      );
    }

    console.log(chalk.cyan(` - Service (v${version}) created`));
  }
};

const processMessagesForOpenAPISpec = async (
  pathToSpec: string,
  document: OpenAPI.Document,
  servicePath: string,
  options: Props & { owners: string[] }
) => {
  const operations = await getOperationsByType(pathToSpec, options.httpMethodsToMessages);
  const sidebarBadgeType = options.sidebarBadgeType || 'HTTP_METHOD';
  const version = document.info.version;
  const preserveExistingMessages = options.preserveExistingMessages ?? true;

  let receives = [],
    sends = [];

  // Go through all messages
  for (const operation of operations) {
    const { requestBodiesAndResponses, sidebar, ...message } = await buildMessage(pathToSpec, document, operation);
    // console.log('operation', operation);
    let messageMarkdown = message.markdown;
    const messageType = operation.type;
    const messageAction = operation.action;

    console.log(chalk.blue(`Processing message: ${message.name} (v${message.version})`));

    const {
      addFileToMessage,
      writeMessage,
      getMessage,
      versionMessage,
      collection: folder,
    } = getMessageTypeUtils(process.env.PROJECT_DIR as string, messageType);

    // Check if the message already exists in the catalog
    const catalogedMessage = await getMessage(message.id, 'latest');

    if (catalogedMessage) {
      // only keep the markdown if the message is being preserved
      if (preserveExistingMessages) {
        messageMarkdown = catalogedMessage.markdown;
      }
      // if the version matches, we can override the message but keep markdown as it  was
      if (catalogedMessage.version !== version) {
        // if the version does not match, we need to version the message
        await versionMessage(message.id);
        console.log(chalk.cyan(` - Versioned previous message: (v${catalogedMessage.version})`));
      }
    }

    let messagePath = join(servicePath, folder, message.id);
    if (options.writeFilesToRoot) {
      messagePath = message.id;
    }

    // Write the message to the catalog
    await writeMessage(
      {
        ...message,
        markdown: messageMarkdown,
        ...(options.owners ? { owners: options.owners } : {}),
        // only if its defined add it to the sidebar
        ...(sidebarBadgeType === 'HTTP_METHOD' ? { sidebar } : {}),
      },
      { path: messagePath, override: true }
    );

    // If the message send or recieved by the service?
    if (messageAction === 'sends') {
      sends.push({
        id: message.id,
        version: message.version,
      });
    } else {
      receives.push({
        id: message.id,
        version: message.version,
      });
    }

    // Does the message have a request body or responses?
    if (requestBodiesAndResponses?.requestBody) {
      await addFileToMessage(
        message.id,
        {
          fileName: 'request-body.json',
          content: JSON.stringify(requestBodiesAndResponses.requestBody, null, 2),
        },
        message.version
      );
    }

    if (requestBodiesAndResponses?.responses) {
      for (const [statusCode, schema] of Object.entries(requestBodiesAndResponses.responses)) {
        const getContent = () => {
          try {
            return JSON.stringify(schema, null, 2);
          } catch (error) {
            // Handle circular references in JSON.stringify
            const seen = new WeakSet();
            return JSON.stringify(
              schema,
              (key, value) => {
                if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) return '[Circular]'; // Handle circular references
                  seen.add(value);
                }
                return value;
              },
              2
            );
          }
        };

        await addFileToMessage(
          message.id,
          {
            fileName: `response-${statusCode}.json`,
            content: getContent(),
          },
          message.version
        );
      }
    }

    console.log(chalk.cyan(` - Message (v${message.version}) created`));
    if (!operation.operationId) {
      console.log(chalk.yellow(`  - OperationId not found for ${operation.method} ${operation.path}, creating one...`));
      console.log(chalk.yellow(`  - Use operationIds to give better unique names for EventCatalog`));
    }
  }
  return { receives, sends };
};

const getParsedSpecFile = (service: Service, document: OpenAPI.Document) => {
  const isSpecFileJSON = service.path.endsWith('.json');
  return isSpecFileJSON ? JSON.stringify(document, null, 2) : yaml.dump(document, { noRefs: true });
};

const getRawSpecFile = async (service: Service) => {
  if (service.path.startsWith('http')) {
    const file = await fetch(service.path, { method: 'GET' });
    if (!file.ok) {
      throw new Error(`Failed to fetch file: ${service.path}, status: ${file.status}`);
    }
    return await file.text();
  }
  return await readFile(service.path, 'utf8');
};
