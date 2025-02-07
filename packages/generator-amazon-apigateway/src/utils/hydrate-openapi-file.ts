export async function hydrate(openApiSpec: any, routeConfig: any, version?: number) {
  // Clone the spec to avoid modifying the original
  const modifiedSpec = JSON.parse(JSON.stringify(openApiSpec));

  // Default configuration - all routes are queries unless specified
  const defaultMessageType = 'query';

  // Set version from config or default to 1
  const specVersion = version || routeConfig.version || 1;
  modifiedSpec.info.version = `${specVersion}`;

  // Iterate through all paths and their methods
  for (const [path, pathItem] of Object.entries(modifiedSpec.paths)) {
    for (const [method, operation] of Object.entries(pathItem as Record<string, unknown>)) {
      if (operation && typeof operation === 'object' && !Array.isArray(operation)) {
        const operationObj = operation as {
          operationId?: string;
          description?: string;
          [key: string]: any;
        };

        const configKey = `${method.toLowerCase()} ${path}`;
        const config = routeConfig[configKey] || {};

        // Add message type extension
        const messageType = typeof config === 'string' ? config : config.type || defaultMessageType;
        operationObj['x-eventcatalog-message-type'] = messageType;

        // Set operationId
        if (typeof config === 'object' && config.id) {
          operationObj.operationId = config.id;
        } else if (!operationObj.operationId) {
          const normalizedPath = path.replace(/^\//, '').replace(/\//g, '_').replace(/[{}]/g, '');

          operationObj.operationId = `${method.toLowerCase()}_${normalizedPath}`;
        }

        // Add description if provided in config
        if (typeof config === 'object' && config.description) {
          operationObj.description = config.description;
        }

        // Add optional message ID and name if provided
        if (typeof config === 'object') {
          if (config.id) {
            operationObj['x-eventcatalog-message-id'] = config.id;
          }
          if (config.name) {
            operationObj['x-eventcatalog-message-name'] = config.name;
          }
        }
      }
    }
  }

  return modifiedSpec;
}
