import { Schema, SchemaType } from '../types';
import { getSchemaFileName } from './messages';

export const getMarkdownForSchema = (schema: Schema) => {
  const schemaFileName = getSchemaFileName(schema);

  // Use SchemaViewer for JSON and Avro schemas, Schema component for others
  const useSchemaViewer = schema.schemaType === SchemaType.JSON || schema.schemaType === SchemaType.AVRO;
  const schemaComponent = useSchemaViewer
    ? `<SchemaViewer file="${schemaFileName}" />`
    : `<Schema file="${schemaFileName}" />`;

  return `
## Architecture diagram

A visual representation of the {frontmatter.name} message.

<NodeGraph />

---

## Schema
This is the schema for the {frontmatter.name} message.
${schemaComponent}`;
};

export const getMarkdownForService = ({ registryUrl }: { registryUrl: string }) => {
  return `This documentation is for the \{frontmatter.name\} service.

<Tiles columns=\{2\}>
  <Tile icon="DocumentIcon"  iconColor="text-purple-500" href="${registryUrl}" title="Apicurio Registry" target="_blank" description="View the Apicurio Registry" />
  <Tile icon="ChatBubbleLeftIcon"  iconColor="text-yellow-500" href=\{\`/visualiser/services/$\{frontmatter.id\}\`\} title="Explore the service in the visualizer" description="View the service in the EventCatalog Visualizer" />
</Tiles>

:::tip
You can edit this markdown file, the plugin will persist your changes and keep your schemas in sync.
:::

## Architecture Diagram

The architecture diagram below shows the {frontmatter.name} service and its dependencies.

<NodeGraph />
  `;
};

export const getMarkdownForDomain = () => {
  return `This is the \{frontmatter.name\} domain.

<Tiles columns=\{2\}>
  <Tile icon="ArrowUpLeftIcon"  iconColor="text-yellow-500" href=\{\`/visualiser/domains/$\{ frontmatter.id \} \`\} title="Open domain in visualizer" description="View the domain architecture in EventCatalog Visualizer" />
  <Tile icon="ServerIcon"  iconColor="text-pink-500" href=\{\`/discover/domains\`\} title=\{\`Explore services in this domain\`\} description="Explore the services in this domain" />
</Tiles>


### Domain Architecture
The following is the architecture diagram for all the messages and services in the {frontmatter.name} domain.
<NodeGraph />

### Messages

<MessageTable limit={10} showChannels={true} />`;
};
