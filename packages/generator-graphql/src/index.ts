import utils from '@eventcatalog/sdk';
import { readFile } from 'node:fs/promises';
import argv from 'minimist';
import yaml from 'js-yaml';
import { z } from 'zod';
import chalk from 'chalk';
import path from 'path';
import pkgJSON from '../package.json';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';

// GraphQL imports
import { buildSchema, printSchema } from 'graphql';

import {
  defaultMarkdown as generateMarkdownForMessage,
  getMessageName,
  getSummary as getMessageSummary,
  getMessageTypeForOperation,
  getOperationsFromSchema,
} from './utils/messages';
import { defaultMarkdown as generateMarkdownForService, getSummary as getServiceSummary } from './utils/services';
import { defaultMarkdown as generateMarkdownForDomain } from './utils/domains';
import checkLicense from '../../../shared/checkLicense';

import { Service, Domain, Message } from './types';
import { join } from 'node:path';

const cliArgs = argv(process.argv.slice(2));

const optionsSchema = z.object({
  licenseKey: z.string().optional(),
  writeFilesToRoot: z.boolean().optional(),
  services: z.array(
    z.object({
      id: z.string({ required_error: 'The service id is required. please provide the service id' }),
      path: z.string({ required_error: 'The service path is required. please provide the path to GraphQL schema file' }),
      draft: z.boolean().optional(),
      name: z.string().optional(),
      owners: z.array(z.string()).optional(),
      generateMarkdown: z
        .function()
        .args(
          z.object({
            service: z.any(),
            schema: z.any(),
          })
        )
        .returns(z.string())
        .optional(),
    })
  ),
  domain: z
    .object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
      markdown: z.string().optional(),
    })
    .optional(),
  messages: z
    .object({
      generateMarkdown: z
        .function()
        .args(
          z.object({
            field: z.any(),
            operationType: z.enum(['query', 'mutation', 'subscription']),
            serviceName: z.string(),
          })
        )
        .returns(z.string())
        .optional(),
    })
    .optional(),
  debug: z.boolean().optional(),
  saveParsedSpecFile: z.boolean().optional(),
});

type Options = z.infer<typeof optionsSchema>;

export default async (_: any, options: Options) => {
  if (!process.env.PROJECT_DIR) {
    process.env.PROJECT_DIR = process.cwd();
  }

  if (!process.env.PROJECT_DIR) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  // Check if the license is valid
  const LICENSE_KEY: string = process.env.EVENTCATALOG_LICENSE_KEY_GRAPHQL || options.licenseKey || '';
  await checkLicense(pkgJSON.name, LICENSE_KEY);
  await checkForPackageUpdate(pkgJSON.name);

  const {
    writeService,
    writeDomain,
    writeMessage,
    getService,
    getDomain,
    rmService,
    versionService,
    rmDomain,
    versionDomain,
  } = utils(process.env.PROJECT_DIR);

  const validatedOptions = optionsSchema.parse(options);
  const { services, domain, debug, saveParsedSpecFile, messages } = validatedOptions;

  console.log(chalk.blue(`\n🚀 Processing ${services.length} GraphQL schema(s)...\n`));

  for (const service of services) {
    try {
      console.log(chalk.cyan(`📄 Processing GraphQL schema: ${service.path}`));

      // Load the GraphQL schema
      const schemaContent = await readFile(service.path, 'utf-8');
      const schema = buildSchema(schemaContent);

      if (debug) {
        console.log(chalk.gray(`Schema loaded successfully for service: ${service.id}`));
      }

      // Check if service exists and handle versioning
      const existingService = await getService(service.id);
      if (existingService) {
        await versionService(service.id);
        await rmService(service.id);
      }

      // Generate service documentation
      const serviceMarkdown = service.generateMarkdown
        ? service.generateMarkdown({ service, schema })
        : generateMarkdownForService({ service, schema });

      await writeService({
        id: service.id,
        name: service.name || service.id,
        version: '1.0.0',
        summary: getServiceSummary({ service }),
        markdown: serviceMarkdown,
        ...(service.draft && { draft: service.draft }),
        ...(service.owners && { owners: service.owners }),
      });

      // Save the schema file if requested
      if (saveParsedSpecFile) {
        await writeService({
          id: service.id,
          name: service.name || service.id,
          version: '1.0.0',
          summary: getServiceSummary({ service }),
          markdown: serviceMarkdown,
          schemaFile: {
            fileName: 'schema.graphql',
            content: printSchema(schema),
          },
          ...(service.draft && { draft: service.draft }),
          ...(service.owners && { owners: service.owners }),
        });
      }

      // Process queries
      const queries = getOperationsFromSchema(schema.getQueryType(), 'query');

      for (const { field, operationType } of queries) {
        const messageType = getMessageTypeForOperation(operationType);
        const messageName = getMessageName(field);
        const messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id });

        await writeMessage({
          id: messageName,
          name: messageName,
          version: '1.0.0',
          summary: getMessageSummary({ field, operationType }),
          markdown: messageMarkdown,
          type: messageType,
          producers: [{ id: service.id, version: '1.0.0' }],
        });
      }

      // Process mutations
      const mutations = getOperationsFromSchema(schema.getMutationType(), 'mutation');
      for (const { field, operationType } of mutations) {
        const messageType = getMessageTypeForOperation(operationType);
        const messageName = getMessageName(field);
        const messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id });

        await writeMessage({
          id: messageName,
          name: messageName,
          version: '1.0.0',
          summary: getMessageSummary({ field, operationType }),
          markdown: messageMarkdown,
          type: messageType,
          producers: [{ id: service.id, version: '1.0.0' }],
        });
      }

      // Process subscriptions
      const subscriptions = getOperationsFromSchema(schema.getSubscriptionType(), 'subscription');
      for (const { field, operationType } of subscriptions) {
        const messageType = getMessageTypeForOperation(operationType);
        const messageName = getMessageName(field);
        const messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id });

        await writeMessage({
          id: messageName,
          name: messageName,
          version: '1.0.0',
          summary: getMessageSummary({ field, operationType }),
          markdown: messageMarkdown,
          type: messageType,
          producers: [{ id: service.id, version: '1.0.0' }],
        });
      }

      console.log(chalk.green(`✅ Successfully processed GraphQL schema: ${service.id}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to process GraphQL schema: ${service.path}`));
      console.error(chalk.red(error));
      throw error;
    }
  }

  // Handle domain if specified
  if (domain) {
    const existingDomain = await getDomain(domain.id, domain.version);
    if (existingDomain && existingDomain.version !== domain.version) {
      await versionDomain(domain.id);
      await rmDomain(domain.id);
    }

    const domainMarkdown = generateMarkdownForDomain({ domain });
    const domainServices = services.map((service) => ({ id: service.id, version: '1.0.0' }));

    await writeDomain({
      id: domain.id,
      name: domain.name,
      version: domain.version,
      markdown: domainMarkdown,
      services: domainServices,
    });

    console.log(chalk.green(`✅ Domain "${domain.name}" created/updated with ${services.length} service(s)`));
  }

  console.log(chalk.blue('\n🎉 GraphQL schema processing complete!\n'));
};