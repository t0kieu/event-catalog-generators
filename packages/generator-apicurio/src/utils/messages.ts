import { Schema, SchemaType } from '../types';
import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { getMarkdownForSchema } from './markdown';
import { join } from 'path';

export const getSchemaFileName = (schema: Schema) => {
  const schemaType = schema.schemaType || SchemaType.JSON;
  let extension = 'json';

  switch (schemaType) {
    case 'PROTOBUF':
      extension = 'proto';
      break;
    case 'AVRO':
      extension = 'avsc';
      break;
    case 'JSON':
      extension = 'json';
      break;
    case 'ASYNCAPI':
      extension = 'yaml';
      break;
    case 'OPENAPI':
      extension = 'yaml';
      break;
    default:
      extension = 'json';
  }

  return `${schema.artifactId}.${extension}`;
};

export const writeMessageToEventCatalog = async ({
  pathToCatalog,
  message,
  rootPath = '',
  serviceId,
  messageType,
}: {
  pathToCatalog: string;
  message: Schema;
  rootPath?: string;
  serviceId?: string;
  messageType: 'event' | 'command' | 'query';
}) => {
  const {
    writeEvent,
    writeCommand,
    writeQuery,
    getCommand,
    getQuery,
    addSchemaToCommand,
    addSchemaToQuery,
    writeCommandToService,
    writeQueryToService,
    getEvent,
    versionEvent,
    versionCommand,
    versionQuery,
    addSchemaToEvent,
    writeEventToService,
  } = utils(pathToCatalog);

  const MESSAGE_OPERATIONS: Record<'event' | 'command' | 'query', any> = {
    event: {
      write: writeEvent,
      version: versionEvent,
      get: getEvent,
      addSchema: addSchemaToEvent,
      addSchemaToMessage: addSchemaToEvent,
      writeMessageToService: writeEventToService,
      collection: 'events',
    },
    command: {
      write: writeCommand,
      version: versionCommand,
      get: getCommand,
      addSchema: addSchemaToCommand,
      addSchemaToMessage: addSchemaToCommand,
      writeMessageToService: writeCommandToService,
      collection: 'commands',
    },
    query: {
      write: writeQuery,
      version: versionQuery,
      get: getQuery,
      addSchema: addSchemaToQuery,
      addSchemaToMessage: addSchemaToQuery,
      writeMessageToService: writeQueryToService,
      collection: 'queries',
    },
  };

  const {
    write: writeMessage,
    version: versionMessage,
    get: getMessage,
    addSchema: addSchemaToMessage,
    collection,
    writeMessageToService,
  } = MESSAGE_OPERATIONS[messageType];

  const schemaFileName = getSchemaFileName(message);
  let messagePath = join(rootPath, collection, message.messageId);

  // Get the current message in the catalog (the latest version in root)
  const messageInCatalog = await getMessage(message.messageId, 'latest');
  const { channels, ...previousMessageInformation } = messageInCatalog || {};

  // Check if this specific version already exists
  const existingVersionedMessage = await getMessage(message.messageId, message.version.toString());

  // If this is NOT the latest version
  if (!message.latestVersion) {
    // Check if this version already exists - if yes, skip it
    if (existingVersionedMessage && existingVersionedMessage.version.toString() === message.version.toString()) {
      console.log(chalk.gray(`  - Skipping ${message.messageId} (v${message.version}) - already exists in catalog`));
      return;
    }
    // If this is not the latest version, NEVER version what's in root
    // Just write this old version directly (SDK will handle versioned folder)
  }

  // Track if we just versioned the current message
  let justVersioned = false;

  // If there's a different version in the catalog root, version it first
  if (messageInCatalog && messageInCatalog.version.toString() !== message.version.toString()) {
    await versionMessage(message.messageId);
    console.log(chalk.cyan(` - Versioned previous message: ${message.messageId} (v${messageInCatalog.version})`));
    justVersioned = true;
  }

  // If the message has a summary, we should use it
  const summary = messageInCatalog?.summary || 'Message from Apicurio Registry';
  const badges = messageInCatalog?.badges || [
    { backgroundColor: 'blue', textColor: 'white', content: 'Apicurio', icon: 'apicurio' },
  ];
  const markdown = messageInCatalog?.markdown || getMarkdownForSchema(message);

  const messageToWrite = {
    ...previousMessageInformation,

    id: message.messageId,
    name: message.messageId,
    version: message.version.toString(),
    schemaPath: schemaFileName,
    summary,
    badges,
    markdown,
  };

  // Determine if we should override:
  // - If we just versioned the previous message, we need to override to write the new one
  // - If it's the latest version and same version exists: override to update it
  // - Otherwise: don't override
  const shouldOverride =
    justVersioned ||
    (message.latestVersion && messageInCatalog && messageInCatalog.version.toString() === message.version.toString());

  try {
    if (serviceId) {
      await writeMessageToService(messageToWrite, { id: serviceId }, { override: shouldOverride });
    } else {
      await writeMessage(messageToWrite, {
        path: messagePath,
        override: shouldOverride,
      });
    }

    await addSchemaToMessage(message.messageId, { fileName: schemaFileName, schema: message.schema });
  } catch (error: any) {
    // If the error is because the version already exists and we're trying to write a non-latest version,
    // just skip it silently - this happens on reruns
    if (!message.latestVersion && error.message && error.message.includes('already exists')) {
      console.log(chalk.gray(`  - Skipping ${message.messageId} (v${message.version}) - already exists in catalog`));
      return;
    }
    // Otherwise, rethrow the error
    throw error;
  }
};
