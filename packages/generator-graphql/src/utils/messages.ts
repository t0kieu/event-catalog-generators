import {
  GraphQLFieldMap,
  GraphQLObjectType,
  isNonNullType,
  isListType,
  GraphQLField,
  GraphQLArgument,
  GraphQLSchema,
  isObjectType,
  GraphQLType,
} from 'graphql';
import { GraphQLOperationType } from '../types';

export const defaultMarkdown = ({
  field,
  operationType,
  serviceName,
  schema,
}: {
  field: GraphQLField<any, any>;
  operationType: GraphQLOperationType;
  serviceName: string;
  schema?: GraphQLSchema;
}) => {
  const args = field.args || [];
  const hasArgs = args.length > 0;

  return `## Operation Details

- **Type**: ${operationType}
- **Return Type**: ${getTypeString(field.type)}
${hasArgs ? `- **Arguments**: ${args.length}` : '- **Arguments**: None'}

${hasArgs ? generateArgumentsTable(args) : ''}

## Code Example

\`\`\`graphql
${generateCodeSnippet(field, operationType, schema)}
\`\`\`

<NodeGraph />`;
};

export const getMessageName = (field: GraphQLField<any, any>) => {
  return field.name;
};

export const getSummary = ({ field, operationType }: { field: GraphQLField<any, any>; operationType: GraphQLOperationType }) => {
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
  return Object.values(fields).map((field) => ({
    field,
    operationType,
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
  const rows = args
    .map((arg) => {
      const type = getTypeString(arg.type);
      const description = arg.description || '';
      return `| ${arg.name} | ${type} | ${description} |`;
    })
    .join('\n');

  return `\n## Arguments\n\n${header}\n${rows}`;
}

function generateCodeSnippet(field: GraphQLField<any, any>, operationType: GraphQLOperationType, schema?: GraphQLSchema): string {
  const args = field.args || [];
  const hasArgs = args.length > 0;

  // Generate arguments string with example values
  const argsString = hasArgs ? `(${args.map((arg) => `${arg.name}: ${getExampleValue(arg.type, schema)}`).join(', ')})` : '';

  // Generate the fields to select in the response with proper type introspection
  const returnFields = generateReturnFields(field.type, schema);

  switch (operationType) {
    case 'query':
      return `query {
  ${field.name}${argsString} ${returnFields}
}`;
    case 'mutation':
      return `mutation {
  ${field.name}${argsString} ${returnFields}
}`;
    case 'subscription':
      return `subscription {
  ${field.name}${argsString} ${returnFields}
}`;
    default:
      return `${field.name}${argsString} ${returnFields}`;
  }
}

function getExampleValue(type: any, schema?: GraphQLSchema, depth: number = 0): string {
  if (depth > 3) return '"..."'; // Prevent infinite recursion

  if (isNonNullType(type)) {
    return getExampleValue(type.ofType, schema, depth);
  }
  if (isListType(type)) {
    return `[${getExampleValue(type.ofType, schema, depth)}]`;
  }

  switch (type.name) {
    case 'String':
      return '"example"';
    case 'Int':
      return '123';
    case 'Float':
      return '123.45';
    case 'Boolean':
      return 'true';
    case 'ID':
      return '"1"';
    default:
      // For custom input types, try to generate a more realistic example
      if (schema && isObjectType(type)) {
        const fields = type.getFields();
        const fieldEntries = Object.entries(fields).slice(0, 3); // Limit to first 3 fields

        if (fieldEntries.length > 0) {
          const fieldExamples = fieldEntries
            .map(([fieldName, field]) => `${fieldName}: ${getExampleValue(field.type, schema, depth + 1)}`)
            .join(', ');
          return `{ ${fieldExamples} }`;
        }
      }

      // For input types that we can't resolve, provide a placeholder
      return type.name.includes('Input') ? '{ /* input fields */ }' : '"example"';
  }
}

function generateReturnFields(type: any, schema?: GraphQLSchema, depth: number = 0): string {
  if (depth > 2) return ''; // Prevent infinite recursion

  if (isNonNullType(type)) {
    return generateReturnFields(type.ofType, schema, depth);
  }
  if (isListType(type)) {
    return generateReturnFields(type.ofType, schema, depth);
  }

  // For scalar types, don't add braces
  if (['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)) {
    return '';
  }

  // For object types, try to generate realistic field selection
  if (schema && isObjectType(type)) {
    const fields = type.getFields();
    const fieldEntries = Object.entries(fields);

    if (fieldEntries.length > 0) {
      const selectedFields = fieldEntries
        .slice(0, 5) // Limit to first 5 fields to keep examples manageable
        .map(([fieldName, field]) => {
          const subFields = generateReturnFields(field.type, schema, depth + 1);
          return `    ${fieldName}${subFields}`;
        })
        .join('\n');

      return `{
${selectedFields}
  }`;
    }
  }

  // For unknown object types, add a basic field selection template
  return `{
    # Add fields you want to select
  }`;
}
