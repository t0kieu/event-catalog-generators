import { Schema, SchemaType } from '../types';
import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { getMarkdownForSchema } from './markdown';
import { join } from 'path';
export const getSchemaFileName = (schema: Schema) => {
  // default is 'AVRO'
  const schemaType = schema.schemaType || SchemaType.AVRO;
  const extension = schemaType === SchemaType.PROTOBUF ? 'proto' : schemaType.toLowerCase();
  return `${schema.subject}.${extension}`;
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
  messageType: 'event' | 'command';
}) => {
  const {
    writeEvent,
    writeCommand,
    getCommand,
    addSchemaToCommand,
    writeCommandToService,
    getEvent,
    versionEvent,
    versionCommand,
    addSchemaToEvent,
    writeEventToService,
  } = utils(pathToCatalog);

  // Define the message operations mapping with proper types
  const MESSAGE_OPERATIONS: Record<'event' | 'command', any> = {
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
  };

  const {
    write: writeMessage,
    version: versionMessage,
    get: getMessage,
    addSchema: addSchemaToMessage,
    collection,
    writeMessageToService: writeMessageToService,
  } = MESSAGE_OPERATIONS[messageType];

  const schemaFileName = getSchemaFileName(message);
  let topicPath = join(rootPath, collection, message.eventId);

  const messageInCatalog = await getMessage(message.eventId);
  const { ...previousMessageInformation } = messageInCatalog || {};

  if (messageInCatalog) {
    if (message.version.toString() !== messageInCatalog.version.toString()) {
      await versionMessage(message.eventId);
      console.log(chalk.cyan(` - Versioned previous message: ${message.eventId} (v${messageInCatalog.version})`));
    } else {
      // await rmEventById(topic.eventId, topic.version.toString());
    }
  }

  const messageToWrite = {
    ...previousMessageInformation,

    // these fields are always going to be the same
    id: message.eventId,
    name: message.eventId,
    version: message.version.toString(),
    schemaPath: schemaFileName,

    ...(message.topic ? { channels: [{ id: message.topic, version: '0.0.1' }] } : {}),

    // If the topic does not already exist we need to add fields for new documented topics
    ...(!messageInCatalog
      ? {
          markdown: getMarkdownForSchema(message),
          badges: [{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Message', icon: 'kafka' }],
          summary: 'Message from Confluent Schema Registry',
        }
      : {}),
  };

  if (serviceId) {
    await writeMessageToService(
      messageToWrite,
      { id: serviceId },
      { override: messageInCatalog?.version.toString() === message.version.toString() }
    );
  } else {
    await writeMessage(messageToWrite, {
      path: topicPath,
      override: messageInCatalog?.version.toString() === message.version.toString(),
    });
  }

  await addSchemaToMessage(message.eventId, { fileName: schemaFileName, schema: message.schema });

  if (!message.latestVersion) {
    await versionMessage(message.eventId);
  }
};
