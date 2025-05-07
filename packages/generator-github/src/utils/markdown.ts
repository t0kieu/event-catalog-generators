import { Message } from '../types';

export const getMarkdownForMessage = (message: Message, schemaPath: string) => {
  return `{/* You can edit this documentation, it will be persisted between imports */}

## Architecture diagram

A visual representation of the {frontmatter.name} message.

<NodeGraph />

---
  
## Schema
This is the schema for the {frontmatter.name} message.  
<Schema file="${schemaPath}" />`;
};

export const getMarkdownForService = () => {
  return `This documentation is for the \{frontmatter.name\} service. 

<Tiles columns=\{2\}>
  <Tile icon="DocumentIcon"  iconColor="text-purple-500" href="/discover/services" title="Explore other services" target="_blank" description="View all services in the catalog" />
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
