import axios from 'axios';
import { SchemaType } from '../types';

export interface AzureSchemaRegistrySchema {
  id: string;
  groupName: string;
  name: string;
  version: number;
  schemaType: SchemaType;
  content: string;
  latestVersion?: boolean;
}

// Azure Schema Registry API response for listing versions
interface AzureSchemaVersionsResponse {
  Value: number[];
  NextLink?: string;
}

/**
 * Get the authorization token from environment variable
 */
const getAuthToken = (): string => {
  const token = process.env.AZURE_SCHEMA_REGISTRY_TOKEN;
  if (!token) {
    throw new Error('AZURE_SCHEMA_REGISTRY_TOKEN environment variable is not set');
  }
  return token;
};

/**
 * Get all versions for a specific schema
 */
const getSchemaVersions = async (registryUrl: string, schemaGroup: string, schemaName: string): Promise<number[]> => {
  const token = getAuthToken();
  const apiVersion = '2023-07-01';
  const url = `${registryUrl}/$schemagroups/${schemaGroup}/schemas/${schemaName}/versions?api-version=${apiVersion}`;

  try {
    const response = await axios.get<AzureSchemaVersionsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Azure API returns { Value: [1, 2, 3], NextLink?: "..." }
    return response.data.Value;
  } catch (error) {
    console.error(`Failed to fetch versions for schema ${schemaName} from group ${schemaGroup}:`, error);
    return [];
  }
};

/**
 * Get a specific version of a schema from a schema group
 */
export const getSchemaByVersion = async (
  registryUrl: string,
  schemaGroup: string,
  schemaName: string,
  version: number
): Promise<AzureSchemaRegistrySchema> => {
  const token = getAuthToken();
  const apiVersion = '2023-07-01';
  const url = `${registryUrl}/$schemagroups/${schemaGroup}/schemas/${schemaName}/versions/${version}?api-version=${apiVersion}`;

  // The response body is the schema definition itself (as JSON object)
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // The response body directly contains the schema JSON
  // Serialize it back to string for storage
  const schemaContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);

  // Generate a schema ID from the group and name
  const schemaId = `${schemaGroup}/${schemaName}/${version}`;

  // Determine schema type from the schema content
  // Check if it looks like an Avro schema (has "type" and "namespace" or "name" at root)
  let schemaType: SchemaType = SchemaType.JSON;
  if (typeof response.data === 'object' && response.data !== null) {
    // Avro schemas typically have these properties at the root level
    if ('type' in response.data && ('namespace' in response.data || 'name' in response.data)) {
      schemaType = SchemaType.AVRO;
    }
  }

  return {
    id: schemaId,
    groupName: schemaGroup,
    name: schemaName,
    version: version,
    schemaType,
    content: schemaContent,
  };
};

/**
 * Get the latest 5 versions of a schema from a schema group
 */
export const getAllSchemaVersions = async (
  registryUrl: string,
  schemaGroup: string,
  schemaName: string
): Promise<AzureSchemaRegistrySchema[]> => {
  // First, get all version numbers for this schema
  const allVersions = await getSchemaVersions(registryUrl, schemaGroup, schemaName);

  if (allVersions.length === 0) {
    throw new Error(`No versions found for schema ${schemaName} in group ${schemaGroup}`);
  }

  // Sort versions descending (highest first) and take only the latest 5
  const latestVersions = allVersions.sort((a, b) => b - a).slice(0, 5);

  // Fetch the latest 5 versions in parallel
  const schemaPromises = latestVersions.map((version) => getSchemaByVersion(registryUrl, schemaGroup, schemaName, version));

  const schemas = await Promise.all(schemaPromises);

  // Mark the latest version (highest number)
  const latestVersion = Math.max(...latestVersions);
  return schemas.map((schema) => ({
    ...schema,
    latestVersion: schema.version === latestVersion,
  }));
};

/**
 * Get schemas for specific service filters
 * Fetches the latest 5 versions of each schema
 */
export const getSchemasForServices = async (
  registryUrl: string,
  filters: Array<{ id: string; schemaGroup: string; schemaRegistryUrl?: string }>
): Promise<AzureSchemaRegistrySchema[]> => {
  const schemas: AzureSchemaRegistrySchema[] = [];

  for (const filter of filters) {
    try {
      // Use the custom schemaRegistryUrl if provided, otherwise use the default
      const urlToUse = filter.schemaRegistryUrl || registryUrl;

      // Always fetch all versions of the schema
      const allVersions = await getAllSchemaVersions(urlToUse, filter.schemaGroup, filter.id);
      schemas.push(...allVersions);
    } catch (error) {
      console.error(`Failed to fetch schema ${filter.id} from group ${filter.schemaGroup}:`, error);
    }
  }

  return schemas;
};
