import { GlueSchema } from '../types';

const getGlueConsoleURL = (schema: GlueSchema, region: string) => {
  return `https://${region}.console.aws.amazon.com/glue/home?region=${region}#/v2/data-catalog/schemas/view/${encodeURIComponent(schema.registryName)}/${encodeURIComponent(schema.name)}`;
};

const getRegistryURL = (schema: GlueSchema, region: string) => {
  return `https://${region}.console.aws.amazon.com/glue/home?region=${region}#/v2/data-catalog/schemaRegistries/view/${encodeURIComponent(schema.registryName)}`;
};

const getSchemaDownloadURL = (schema: GlueSchema) => {
  const extension = schema.dataFormat === 'AVRO' ? 'avsc' : schema.dataFormat === 'PROTOBUF' ? 'proto' : 'json';
  return `/generated/events/${schema.id}/${schema.name}-schema.${extension}`;
};

export const defaultMarkdown = (schema: GlueSchema, region: string) => {
  const schemaFileName = `${schema.name}-schema.${schema.dataFormat === 'AVRO' ? 'avsc' : schema.dataFormat === 'PROTOBUF' ? 'proto' : 'json'}`;

  // Use SchemaViewer for JSON schemas, Schema component for others
  const schemaComponent =
    schema.dataFormat === 'JSON'
      ? `<SchemaViewer file="${schemaFileName}" title="Schema Definition" maxHeight="500" />`
      : `<Schema file="${schemaFileName}" title="Schema Definition" maxHeight="500" />`;

  return `

## Overview

Documentation for the AWS Glue Schema ${schema.name} in registry ${schema.registryName}.

<Tiles >
    <Tile icon="GlobeAltIcon" href="${getGlueConsoleURL(schema, region)}" openWindow={true} title="Open schema in AWS console" description="View the ${schema.name} schema directly in the AWS Glue console" />
    <Tile icon="GlobeAltIcon" href="${getRegistryURL(schema, region)}" openWindow={true} title="View registry" description="Open the ${schema.registryName} registry in the AWS Glue console" />
    <Tile icon="ArrowDownTrayIcon" href="${getSchemaDownloadURL(schema)}" title="Download schema" description="Download the schema definition" />
</Tiles>  

## Message Details

**Data Format:** ${schema.dataFormat || 'Unknown'}
**Version:** ${schema.version || '1'}
${schema.compatibility ? `**Compatibility:** ${schema.compatibility}` : ''}
${schema.status ? `**Status:** ${schema.status}` : ''}
${schema.description ? `**Description:** ${schema.description}` : ''}

## How is this message used?
<NodeGraph />

## Schema Definition

${schema.schemaDefinition ? schemaComponent : 'No schema definition available'}

`;
};

export const getBadgesForMessage = (schema: GlueSchema, registryName: string) => {
  let badges = [];

  badges.push({ content: `Registry: ${registryName}`, backgroundColor: 'blue', textColor: 'blue' });

  if (schema.dataFormat) {
    badges.push({ content: `Format: ${schema.dataFormat}`, backgroundColor: 'green', textColor: 'green' });
  }

  if (schema.compatibility) {
    badges.push({ content: `Compatibility: ${schema.compatibility}`, backgroundColor: 'purple', textColor: 'purple' });
  }

  if (schema.status) {
    badges.push({ content: `Status: ${schema.status}`, backgroundColor: 'orange', textColor: 'orange' });
  }

  return badges;
};
