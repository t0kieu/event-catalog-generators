import { OpenAPI } from 'openapi-types';
import { getSchemasByOperationId } from './openapi';
import { OpenAPIOperation, OpenAPIParameter, Operation } from '../types';
import slugify from 'slugify';

const markdownForParameters = (parameters: OpenAPIParameter[]) => {
  let markdown = '### Parameters\n';

  for (const parameter of parameters) {
    markdown += `- **${parameter.name}** (${parameter.in})`;
    if (parameter.required) {
      markdown += ' (required)';
    }
    if (parameter.description) {
      markdown += `: ${parameter.description}`;
    }
    markdown += '\n';
  }

  return markdown;
};

export const markdownForResponses = (openAPIOperation: OpenAPIOperation) => {
  let markdown = '### Responses\n\n';

  const getStatusCodeColor = (code: string) => {
    const firstDigit = code[0];
    switch (firstDigit) {
      case '2':
        return 'green';
      case '4':
        return 'orange';
      case '5':
        return 'red';
      default:
        return 'gray';
    }
  };

  for (const [statusCode, content] of Object.entries(openAPIOperation.responses as any)) {
    const color = getStatusCodeColor(statusCode);
    const statusText =
      {
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '204': 'No Content',
        '301': 'Moved Permanently',
        '302': 'Found',
        '304': 'Not Modified',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '409': 'Conflict',
        '422': 'Unprocessable Entity',
        '429': 'Too Many Requests',
        '500': 'Internal Server Error',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Timeout',
      }[statusCode] || '';

    markdown += `#### <span className="text-${color}-500">${statusCode}${statusText ? ` ${statusText}` : ''}</span>\n`;

    // Add description if available
    if ((content as any).description) {
      markdown += `${(content as any).description}\n`;
    }

    // Add schema viewer or JSON content
    if ((content as any).isSchema) {
      markdown += `<SchemaViewer file="response-${statusCode}.json" maxHeight="500" id="response-${statusCode}" />\n\n`;
    } else {
      markdown += `\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\`\n\n`;
    }
  }

  return markdown;
};

export const defaultMarkdown = (message: Operation, openAPIOperation: OpenAPIOperation = {}) => {
  return `
${
  message.description
    ? `
## Overview
${message.description}
`
    : ''
}

${
  message.externalDocs
    ? `
## External documentation
- [${message.externalDocs.description}](${message.externalDocs.url})
`
    : ''
}

## ${message.method.toUpperCase()} \`(${message.path})\`

${openAPIOperation.parameters && openAPIOperation.parameters.length > 0 ? markdownForParameters(openAPIOperation.parameters) : ''}

${
  openAPIOperation.requestBody
    ? `
### Request Body
<SchemaViewer file="request-body.json" maxHeight="500" id="request-body" />
`
    : ''
}

${markdownForResponses(openAPIOperation)}

## Architecture

<NodeGraph />

`;
};

export const getSummary = (message: Operation) => {
  const messageSummary = message.summary ? message.summary : '';
  const messageDescription = message.description ? message.description : '';

  let eventCatalogMessageSummary = messageSummary;

  if (!eventCatalogMessageSummary) {
    eventCatalogMessageSummary = messageDescription && messageDescription.length < 150 ? messageDescription : '';
  }

  return eventCatalogMessageSummary;
};

export const buildMessage = async (pathToFile: string, document: OpenAPI.Document, operation: Operation) => {
  const requestBodiesAndResponses = await getSchemasByOperationId(pathToFile, operation.operationId);
  const extensions = operation.extensions || {};

  const operationTags = operation.tags.map((badge) => ({
    content: `tag:${badge}`,
    textColor: 'blue',
    backgroundColor: 'blue',
  }));

  const badges = [{ content: operation.method.toUpperCase(), textColor: 'blue', backgroundColor: 'blue' }, ...operationTags];

  const apiName = slugify(document.info.title, { lower: true });
  const path = operation.path.replace(/\//, '').replace(/\//g, '_');
  let uniqueIdentifier = operation.operationId || `${apiName}_${operation.method}`;

  if (!operation.operationId && path) {
    uniqueIdentifier = uniqueIdentifier.concat(`_${path}`);
  }

  const httpVerb = operation.method.toUpperCase() || '';

  return {
    id: extensions['x-eventcatalog-message-id'] || uniqueIdentifier,
    version: extensions['x-eventcatalog-message-version'] || document.info.version,
    name: extensions['x-eventcatalog-message-name'] || uniqueIdentifier,
    summary: getSummary(operation),
    markdown: defaultMarkdown(operation, requestBodiesAndResponses),
    schemaPath: requestBodiesAndResponses?.requestBody ? 'request-body.json' : '',
    badges,
    requestBodiesAndResponses,
    sidebar: {
      badge: httpVerb,
    },
    ...(operation.deprecated ? { deprecated: operation.deprecated } : {}),
  };
};
