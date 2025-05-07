import { Message } from '../types';
import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { join, basename } from 'path';
import fs from 'fs/promises';
import { getMarkdownForMessage } from './markdown';

export const processMessageAndSchema = async ({
  pathToCatalog,
  message,
  directory,
  service,
}: {
  pathToCatalog: string;
  message: Message;
  directory: string;
  service?: { id: string; version: string };
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
    getQuery,
    addSchemaToQuery,
    versionQuery,
    writeQuery,
    writeQueryToService,
  } = utils(pathToCatalog);

  // Define the message operations mapping with proper types
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
    },
  };

  const {
    write: writeMessage,
    get: getMessage,
    addSchema: addSchemaToMessage,
    writeMessageToService: writeMessageToService,
  } = MESSAGE_OPERATIONS[message.type];

  const { id, name, version, schemaPath } = message;

  const schemaExists = await fs
    .access(join(directory, schemaPath), fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!schemaExists) {
    console.log(chalk.red(`Schema not found for ${schemaPath}... skipping`));
    throw new Error(`Schema not found for ${schemaPath}`);
  }

  const schema = await fs.readFile(join(directory, schemaPath), 'utf8');
  const fileName = basename(schemaPath);

  const catalogMessage = await getMessage(id, version);

  console.log(chalk.cyan(`Processing message: ${message.name} (v${message.version})`));

  if (!catalogMessage) {
    console.log(chalk.cyan(`- Message ${id} (v${version}) does not exist, creating...`));

    if (service) {
      await writeMessageToService(
        {
          id,
          name: name || id,
          version: version || '1',
          markdown: getMarkdownForMessage(message, fileName),
          schemaPath: fileName,
        },
        { id: service.id },
        { override: true }
      );
      console.log(chalk.green(` - Message ${id} (v${version}) created`));
    } else {
      await writeMessage({
        id,
        name: name || id,
        version: version || '1',
        markdown: getMarkdownForMessage(message, fileName),
        schemaPath: fileName,
      });
      console.log(chalk.green(` - Message ${id} (v${version}) created`));
    }
  } else {
    console.log(chalk.green(`- Message ${id} (v${version}) already exists, updating schema...`));
  }

  await addSchemaToMessage(id, { fileName, schema }, version);
};
