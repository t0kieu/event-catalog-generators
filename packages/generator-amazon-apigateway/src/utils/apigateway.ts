import { APIGatewayClient, GetExportCommand, GetRestApisCommand } from '@aws-sdk/client-api-gateway';

export async function getOpenApiSpec(client: APIGatewayClient, restApiId: string, stageName: string) {
  try {
    const command = new GetExportCommand({
      restApiId: restApiId,
      stageName: stageName,
      exportType: 'oas30', // Use 'swagger' for Swagger/OpenAPI 2.0
      accepts: 'application/json',
    });

    const response = await client.send(command);

    let openAPISpec;

    try {
      openAPISpec = new TextDecoder().decode(response.body);
      return JSON.parse(openAPISpec);
    } catch (error) {
      return response.body;
    }
  } catch (error) {
    console.error('Error fetching OpenAPI specification:', error);
    throw error;
  }
}

export async function getRestApiIdByName(client: APIGatewayClient, apiName: string) {
  try {
    let position: string | undefined;
    do {
      const command = new GetRestApisCommand({
        position: position, // Include the position token for pagination
      });
      const response = await client.send(command);

      const api = response.items?.find((api) => api.name === apiName);
      if (api) {
        return api.id; // Found the API, return its ID
      }

      position = response.position; // Get the next position token
    } while (position); // Continue while there are more APIs to fetch

    throw new Error(`API with name '${apiName}' not found`);
  } catch (error) {
    console.error('Error fetching REST API ID:', error);
    throw error;
  }
}
