import { Schema, SchemaType } from '../types';
import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { getMarkdownForSchema } from './markdown';
import { join } from 'path';
const getSchemaFileName = (schema: Schema) => {
  // default is 'AVRO'
  const schemaType = schema.schemaType || SchemaType.AVRO;
  const extension = schemaType === SchemaType.PROTOBUF ? 'proto' : schemaType.toLowerCase();
  return `${schema.subject}.${extension}`;
};

export const writeTopicToEventCatalog = async ({
  pathToCatalog,
  topic,
  rootPath = '',
  serviceId,
}: {
  pathToCatalog: string;
  topic: Schema;
  rootPath?: string;
  serviceId?: string;
}) => {
  const { writeEvent, getEvent, rmEventById, versionEvent, addSchemaToEvent, writeEventToService } = utils(pathToCatalog);

  const schemaFileName = getSchemaFileName(topic);
  const collection = 'events';
  let topicPath = join(rootPath, collection, topic.eventId);

  console.log('ROOT PATH', rootPath);
  console.log('TOPIC PATH', topicPath);
  console.log('TOPIC', topic);
  // versionEvent

  const topicInCatalog = await getEvent(topic.eventId);
  const { ...previousTopicInformation } = topicInCatalog || {};

  if (topicInCatalog) {
    if (topic.version.toString() !== topicInCatalog.version.toString()) {
      console.log('VERSION MISMATCH', topic.version.toString(), topicInCatalog.version.toString());
      await versionEvent(topic.eventId);
      console.log(chalk.cyan(` - Versioned previous topic: (v${topicInCatalog.version})`));
    } else {
      // await rmEventById(topic.eventId, topic.version.toString());
    }
  }

  const event = {
    ...previousTopicInformation,

    // these fields are always going to be the same
    id: topic.eventId,
    name: topic.eventId,
    version: topic.version.toString(),
    schemaPath: schemaFileName,

    // If the topic does not already exist we need to add fields for new documented topics
    ...(!topicInCatalog
      ? {
          markdown: getMarkdownForSchema(topic),
          badges: [{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Topic' }],
          summary: 'Kafka Topic from Confluent Schema Registry',
        }
      : {}),
  };

  if (serviceId) {
    await writeEventToService(
      event,
      { id: serviceId },
      { override: topicInCatalog?.version.toString() === topic.version.toString() }
    );
  } else {
    await writeEvent(event, { path: topicPath, override: topicInCatalog?.version.toString() === topic.version.toString() });
  }

  await addSchemaToEvent(topic.eventId, { fileName: schemaFileName, schema: topic.schema });

  if (!topic.latestVersion) {
    await versionEvent(topic.eventId);
  }
};
