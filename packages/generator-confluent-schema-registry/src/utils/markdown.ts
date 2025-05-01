import { Schema, Service } from '../types';
import { getSchemaFileName } from './topics';

export const getMarkdownForSchema = (schema: Schema) => {
  const schemaFileName = getSchemaFileName(schema);
  return `
## Architecture diagram

A visual representation of the {frontmatter.name} message.

<NodeGraph />

---
  
## Schema
This is the schema for the {frontmatter.name} message.  
<Schema file="${schemaFileName}" />`;
};

export const getMarkdownForService = () => {
  return `This documentation is for the \{frontmatter.name\} service. 

<Tiles columns=\{2\}>
  <Tile icon="DocumentIcon"  iconColor="text-purple-500" href="https://schema-registry-url.com" title="Confluent Schema Registry" target="_blank" description="View the Confluent Schema Registry" />
  <Tile icon="ChatBubbleLeftIcon"  iconColor="text-yellow-500" href=\{\`/visualiser/services/$\{frontmatter.id\}\`\} title="Explore the service in the visualizer" description="View the service in the EventCatalog Visualizer" />
</Tiles>

:::tip
You can edit this markdown file, the plugin will persist your changes and keep your schemas in sync.
:::

## Kafka Architecture Diagram 

The architecture diagram below shows the {frontmatter.name} service and its dependencies.

<NodeGraph />
  `;
};
