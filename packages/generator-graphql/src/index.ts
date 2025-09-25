import utils from '@eventcatalog/sdk';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import chalk from 'chalk';
import path from 'path';
import pkgJSON from '../package.json';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';

// GraphQL imports
import { buildSchema } from 'graphql';

import {
  defaultMarkdown as generateMarkdownForMessage,
  getMessageName,
  getSummary as getMessageSummary,
  getOperationsFromSchema,
} from './utils/messages';
import { defaultMarkdown as generateMarkdownForService, getSummary as getServiceSummary } from './utils/services';
import { defaultMarkdown as generateMarkdownForDomain } from './utils/domains';
import checkLicense from '../../../shared/checkLicense';

const optionsSchema = z.object({
  licenseKey: z.string().optional(),
  writeFilesToRoot: z.boolean().optional(),
  services: z.array(
    z.object({
      id: z.string({ required_error: 'The service id is required. please provide the service id' }),
      path: z.string({ required_error: 'The service path is required. please provide the path to GraphQL schema file' }),
      summary: z.string().optional(),
      version: z.string(),
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
      owners: z.array(z.string()).optional(),
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
            schema: z.any().optional(),
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
    // writeMessage,
    getService,
    getDomain,
    versionService,
    versionDomain,
    addFileToService,
    writeQuery,
    getQuery,
    versionQuery,
    getCommand,
    writeCommand,
    versionCommand,
    getEvent,
    versionEvent,
    writeEvent,
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
      let schemaPath = path.basename(service.path as string) || 'schema.graphql';
      let serviceMarkdown = generateMarkdownForService({ service, schema, schemaPath });
      let serviceBadges = [] as any;
      let serviceAttachments = [] as any;

      let receives = [] as any;
      let sends = [] as any;

      if (debug) {
        console.log(chalk.gray(`Schema loaded successfully for service: ${service.id}`));
      }

      // Check if service exists and handle versioning
      const latestServiceInCatalog = await getService(service.id, 'latest');
      if (latestServiceInCatalog) {
        // persist data between versions
        serviceMarkdown = latestServiceInCatalog.markdown;
        serviceBadges = latestServiceInCatalog.badges || [];
        serviceAttachments = latestServiceInCatalog.attachments || [];

        if (latestServiceInCatalog.version !== service.version) {
          await versionService(service.id);
          console.log(chalk.cyan(` - Versioned previous service (v${latestServiceInCatalog.version})`));
        }
      }

      //Process queries
      const queries = getOperationsFromSchema(schema.getQueryType(), 'query');

      for (const { field, operationType } of queries) {
        const id = getMessageName(field);
        const latestQueryInCatalog = await getQuery(id, 'latest');

        // We take the service version as the query version for now
        let queryVersion = service.version;
        const messageName = getMessageName(field);
        let messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id, schema });
        let messageBadges = [{ content: 'GraphQL:Query', backgroundColor: 'blue', textColor: 'white' }];
        let messageAttachments = [] as any;

        // persist data between versions
        if (latestQueryInCatalog) {
          messageMarkdown = latestQueryInCatalog.markdown;
          messageBadges = latestQueryInCatalog.badges || [];
          messageAttachments = latestQueryInCatalog.attachments || [];
          if (latestQueryInCatalog.version !== queryVersion) {
            await versionQuery(id);
            console.log(chalk.cyan(` - Versioned previous query: (v${latestQueryInCatalog.version})`));
          }
        }

        await writeQuery(
          {
            id: messageName,
            name: messageName,
            version: queryVersion,
            summary: getMessageSummary({ field, operationType }),
            markdown: messageMarkdown,
            ...(messageBadges.length > 0 ? { badges: messageBadges } : {}),
            ...(messageAttachments.length > 0 ? { attachments: messageAttachments } : {}),
            sidebar: {
              badge: 'Query',
            },
          },
          { override: true }
        );

        // Add query to receives
        receives = [...receives, { id: messageName, version: '1.0.0' }];
      }

      // Process mutations
      const mutations = getOperationsFromSchema(schema.getMutationType(), 'mutation');

      for (const { field, operationType } of mutations) {
        const id = getMessageName(field);
        const latestMutationInCatalog = await getCommand(id, 'latest');

        // We take the service version as the query version for now
        let queryVersion = service.version;
        const messageName = getMessageName(field);
        let messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id, schema });
        let messageBadges = [{ content: 'GraphQL:Mutation', backgroundColor: 'green', textColor: 'white' }];
        let messageAttachments = [] as any;

        // persist data between versions
        if (latestMutationInCatalog) {
          messageMarkdown = latestMutationInCatalog.markdown;
          messageBadges = latestMutationInCatalog.badges || [];
          messageAttachments = latestMutationInCatalog.attachments || [];
          if (latestMutationInCatalog.version !== queryVersion) {
            await versionCommand(id);
            console.log(chalk.cyan(` - Versioned previous mutation: (v${latestMutationInCatalog.version})`));
          }
        }

        await writeCommand(
          {
            id: messageName,
            name: messageName,
            version: queryVersion,
            summary: getMessageSummary({ field, operationType }),
            ...(messageBadges.length > 0 ? { badges: messageBadges } : {}),
            ...(messageAttachments.length > 0 ? { attachments: messageAttachments } : {}),
            markdown: messageMarkdown,
            sidebar: {
              badge: 'Mutation',
            },
          },
          { override: true }
        );

        // Add query to receives
        receives = [...receives, { id: messageName, version: '1.0.0' }];
      }

      const subscriptions = getOperationsFromSchema(schema.getSubscriptionType(), 'subscription');

      for (const { field, operationType } of subscriptions) {
        const id = getMessageName(field);
        const latestEventInCatalog = await getEvent(id, 'latest');

        // We take the service version as the query version for now
        let queryVersion = service.version;
        const messageName = getMessageName(field);
        let messageMarkdown = messages?.generateMarkdown
          ? messages.generateMarkdown({ field, operationType, serviceName: service.name || service.id })
          : generateMarkdownForMessage({ field, operationType, serviceName: service.name || service.id, schema });

        let messageBadges = [{ content: 'GraphQL:Subscription', backgroundColor: 'purple', textColor: 'white' }];
        let messageAttachments = [] as any;

        // persist data between versions
        if (latestEventInCatalog) {
          messageMarkdown = latestEventInCatalog.markdown;
          messageBadges = latestEventInCatalog.badges || [];
          messageAttachments = latestEventInCatalog.attachments || [];
          if (latestEventInCatalog.version !== queryVersion) {
            await versionEvent(id);
            console.log(chalk.cyan(` - Versioned previous subscription: (v${latestEventInCatalog.version})`));
          }
        }

        await writeEvent(
          {
            id: messageName,
            name: messageName,
            version: queryVersion,
            summary: getMessageSummary({ field, operationType }),
            markdown: messageMarkdown,
            ...(messageBadges.length > 0 ? { badges: messageBadges } : {}),
            ...(messageAttachments.length > 0 ? { attachments: messageAttachments } : {}),
            sidebar: {
              badge: 'Subscription',
            },
          },
          { override: true }
        );

        // Add query to receives
        sends = [...sends, { id: messageName, version: '1.0.0' }];
      }

      await writeService(
        {
          id: service.id,
          name: service.name || service.id,
          version: service.version || '1.0.0',
          summary: service.summary,
          markdown: serviceMarkdown,
          ...(serviceBadges.length > 0 ? { badges: serviceBadges } : {}),
          ...(serviceAttachments.length > 0 ? { attachments: serviceAttachments } : {}),
          ...(service.draft && { draft: service.draft }),
          ...(service.owners && { owners: service.owners }),
          ...(receives.length > 0 ? { receives } : {}),
          ...(sends.length > 0 ? { sends } : {}),
          schemaPath,
          specifications: [
            {
              path: schemaPath,
              type: 'graphql',
              name: (service.name || service.id) + 'GraphQL API',
            },
          ],
        },
        { override: true }
      );

      // Add the file to the service
      await addFileToService(service.id, { fileName: schemaPath, content: schemaContent });

      console.log(chalk.green(`✅ Successfully processed GraphQL schema: ${service.id}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to process GraphQL schema: ${service.path}`));
      console.error(chalk.red(error));
      throw error;
    }
  }

  // Handle domain if specified
  if (domain) {
    const currentDomain = await getDomain(domain.id, 'latest');

    console.log(chalk.blue(`\nProcessing domain: ${domain.name} (v${domain.version})`));

    if (currentDomain && currentDomain.version !== domain.version) {
      await versionDomain(domain.id);
      console.log(chalk.cyan(` - Versioned previous domain (v${currentDomain.version})`));
    }

    const domainMarkdown = generateMarkdownForDomain({ domain });
    const domainServices = services.map((service) => ({ id: service.id, version: '1.0.0' }));

    await writeDomain({
      id: domain.id,
      name: domain.name,
      version: domain.version,
      markdown: domainMarkdown,
      services: domainServices,
      ...(domain.owners && { owners: domain.owners }),
    });

    console.log(chalk.green(`✅ Domain "${domain.name}" created/updated with ${services.length} service(s)`));
  }

  console.log(chalk.blue('\n🎉 GraphQL schema processing complete!\n'));
};
