import { GraphQLFieldMap, GraphQLObjectType, isNonNullType, isListType, GraphQLField, GraphQLArgument } from 'graphql';
import { GraphQLOperationType } from '../types';

export const defaultMarkdown = ({
  field,
  operationType,
  serviceName
}: {
  field: GraphQLField<any, any>;
  operationType: GraphQLOperationType;
  serviceName: string;
}) => {
  const args = field.args || [];
  const hasArgs = args.length > 0;

  return `# ${field.name}

${field.description || `${operationType} operation from ${serviceName}`}

## Operation Details

- **Type**: ${operationType}
- **Return Type**: ${getTypeString(field.type)}
${hasArgs ? `- **Arguments**: ${args.length}` : '- **Arguments**: None'}

${hasArgs ? generateArgumentsTable(args) : ''}

<NodeGraph />`;
};

export const getMessageName = (field: GraphQLField<any, any>) => {
  return field.name;
};

export const getSummary = ({
  field,
  operationType
}: {
  field: GraphQLField<any, any>;
  operationType: GraphQLOperationType;
}) => {
  return field.description || `${operationType} operation: ${field.name}`;
};

export const getMessageTypeForOperation = (operationType: GraphQLOperationType): 'query' | 'command' | 'event' => {
  switch (operationType) {
    case 'query':
      return 'query';
    case 'mutation':
      return 'command';
    case 'subscription':
      return 'event';
    default:
      return 'query';
  }
};

export const getOperationsFromSchema = (
  type: GraphQLObjectType | null | undefined,
  operationType: GraphQLOperationType
): Array<{ field: GraphQLField<any, any>; operationType: GraphQLOperationType }> => {
  if (!type) return [];

  const fields = type.getFields();
  return Object.values(fields).map(field => ({
    field,
    operationType
  }));
};

function getTypeString(type: any): string {
  if (isNonNullType(type)) {
    return `${getTypeString(type.ofType)}!`;
  }
  if (isListType(type)) {
    return `[${getTypeString(type.ofType)}]`;
  }
  return type.name;
}

function generateArgumentsTable(args: readonly GraphQLArgument[]): string {
  if (args.length === 0) return '';

  const header = '| Argument | Type | Description |\n|----------|------|-------------|';
  const rows = args.map(arg => {
    const type = getTypeString(arg.type);
    const description = arg.description || '';
    return `| ${arg.name} | ${type} | ${description} |`;
  }).join('\n');

  return `\n## Arguments\n\n${header}\n${rows}`;
}