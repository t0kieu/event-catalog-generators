import { Service } from '../types';
import { GraphQLSchema } from 'graphql';

export const defaultMarkdown = ({
  service,
  schema,
  schemaPath,
}: {
  service: Service;
  schema: GraphQLSchema;
  schemaPath: string;
}) => {
  const queries = schema.getQueryType()?.getFields() || {};
  const mutations = schema.getMutationType()?.getFields() || {};
  const subscriptions = schema.getSubscriptionType()?.getFields() || {};

  const generateLinks = (operations: any, type: 'queries' | 'commands' | 'events') => {
    const operationNames = Object.keys(operations);
    if (operationNames.length === 0) return 'None';

    const tableHeader = `| Operation | Version | Link |
|-----------|---------|------|`;

    const tableRows = operationNames
      .map((name) => `| ${name} | ${service.version} | [View Details](/docs/${type}/${name}/${service.version}) |`)
      .join('\n');

    return `${tableHeader}\n${tableRows}`;
  };

  return `## Architecture

<NodeGraph />

## Operations

### Queries
${generateLinks(queries, 'queries')}

### Mutations (Commands)
${generateLinks(mutations, 'commands')}

### Subscriptions (Events)
${generateLinks(subscriptions, 'events')}
`;
};

export const getSummary = ({ service }: { service: Service }) => {
  return `GraphQL service for ${service.name || service.id}`;
};
