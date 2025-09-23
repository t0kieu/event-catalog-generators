import { Service } from '../types';
import { GraphQLSchema } from 'graphql';

export const defaultMarkdown = ({
  service,
  schema
}: {
  service: Service;
  schema: GraphQLSchema;
}) => {
  return `# ${service.name || service.id}

This service was generated from a GraphQL schema.

## Schema Information

- **Queries**: ${Object.keys(schema.getQueryType()?.getFields() || {}).length}
- **Mutations**: ${Object.keys(schema.getMutationType()?.getFields() || {}).length}
- **Subscriptions**: ${Object.keys(schema.getSubscriptionType()?.getFields() || {}).length}

<NodeGraph />`;
};

export const getSummary = ({ service }: { service: Service }) => {
  return `GraphQL service for ${service.name || service.id}`;
};