import { ApicurioClient } from '../client';
import { Schema, SchemaType, Service, Filter } from '../types';

/**
 * Extract exact artifact IDs from service filters.
 * Returns null if there are non-exact filters (prefix/suffix/includes) that require fetching all.
 */
export const extractExactArtifactIds = (services: Service[]): string[] | null => {
  const exactIds: Set<string> = new Set();
  let hasNonExactFilters = false;

  for (const service of services) {
    const allFilters = [...(service.sends || []), ...(service.receives || [])];

    for (const filter of allFilters) {
      // Check events
      if (filter.events) {
        if (typeof filter.events === 'string') {
          exactIds.add(filter.events);
        } else if (Array.isArray(filter.events)) {
          filter.events.forEach((e) => exactIds.add(e));
        } else if (typeof filter.events === 'object') {
          // Object filter - check if it has exact, or other patterns
          if (filter.events.exact) {
            const exact = filter.events.exact;
            if (typeof exact === 'string') {
              exactIds.add(exact);
            } else if (Array.isArray(exact)) {
              exact.forEach((e) => exactIds.add(e));
            }
          }
          // If there are prefix/suffix/includes, we need to fetch all
          if (filter.events.prefix || filter.events.suffix || filter.events.includes) {
            hasNonExactFilters = true;
          }
        }
      }

      // Check commands
      if (filter.commands) {
        if (typeof filter.commands === 'string') {
          exactIds.add(filter.commands);
        } else if (Array.isArray(filter.commands)) {
          filter.commands.forEach((c) => exactIds.add(c));
        } else if (typeof filter.commands === 'object') {
          if (filter.commands.exact) {
            const exact = filter.commands.exact;
            if (typeof exact === 'string') {
              exactIds.add(exact);
            } else if (Array.isArray(exact)) {
              exact.forEach((e) => exactIds.add(e));
            }
          }
          if (filter.commands.prefix || filter.commands.suffix || filter.commands.includes) {
            hasNonExactFilters = true;
          }
        }
      }

      // Check queries
      if (filter.queries) {
        if (typeof filter.queries === 'string') {
          exactIds.add(filter.queries);
        } else if (Array.isArray(filter.queries)) {
          filter.queries.forEach((q) => exactIds.add(q));
        } else if (typeof filter.queries === 'object') {
          if (filter.queries.exact) {
            const exact = filter.queries.exact;
            if (typeof exact === 'string') {
              exactIds.add(exact);
            } else if (Array.isArray(exact)) {
              exact.forEach((e) => exactIds.add(e));
            }
          }
          if (filter.queries.prefix || filter.queries.suffix || filter.queries.includes) {
            hasNonExactFilters = true;
          }
        }
      }
    }
  }

  // If there are non-exact filters, return null to indicate we need to fetch all
  if (hasNonExactFilters) {
    return null;
  }

  return Array.from(exactIds);
};

/**
 * Fetch only specific artifacts by their IDs (much more efficient than fetching all)
 * When includeAllVersions is true, fetches all versions of each artifact
 */
export const getSchemasByArtifactIds = async (
  registryUrl: string,
  artifactIds: string[],
  includeAllVersions: boolean = false
): Promise<Schema[]> => {
  const client = new ApicurioClient(registryUrl);
  const schemas: Schema[] = [];

  for (const targetArtifactId of artifactIds) {
    try {
      // Get the artifact info
      const artifactData = await client.getArtifactByName(targetArtifactId);

      if (!artifactData) {
        console.warn(`Artifact '${targetArtifactId}' not found in registry`);
        continue;
      }

      const groupId = artifactData.artifact.groupId || 'default';
      const artifactId = artifactData.artifact.artifactId || artifactData.artifact.id || targetArtifactId;
      const artifactType = artifactData.artifact.artifactType || artifactData.artifact.type;
      const latestVersion = artifactData.latestVersion;

      if (includeAllVersions && artifactData.versions && artifactData.versions.length > 0) {
        // Fetch all versions
        for (const version of artifactData.versions) {
          const versionContent = await client.getArtifactContent(groupId, artifactId, version.version);
          const schemaContent = typeof versionContent === 'string' ? versionContent : JSON.stringify(versionContent, null, 2);

          schemas.push({
            artifactId: artifactId,
            messageId: artifactId,
            version: version.version,
            globalId: version.globalId || 0,
            schemaType: artifactType as SchemaType,
            schema: schemaContent,
            latestVersion: version.version === latestVersion,
            groupId,
          });
        }
      } else {
        // Just get the latest version
        const content = artifactData.content;
        const schemaContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

        schemas.push({
          artifactId: artifactId,
          messageId: artifactId,
          version: latestVersion,
          globalId: 0,
          schemaType: artifactType as SchemaType,
          schema: schemaContent,
          latestVersion: true,
          groupId,
        });
      }
    } catch (error) {
      console.error(`Error fetching artifact ${targetArtifactId}:`, error);
    }
  }

  return schemas;
};

export const getSchemasFromRegistry = async (registryUrl: string): Promise<Schema[]> => {
  const client = new ApicurioClient(registryUrl);
  const schemas: Schema[] = [];

  // Search for all artifacts
  const searchResults = await client.searchArtifacts(1000, 0);

  for (const artifact of searchResults.artifacts) {
    const groupId = artifact.groupId || 'default';
    // V3 API uses 'artifactId' instead of 'id', and 'artifactType' instead of 'type'
    const artifactId = artifact.artifactId || artifact.id;
    const artifactType = artifact.artifactType || artifact.type;

    try {
      // Get all versions for this artifact
      const versionsResult = await client.getArtifactVersions(groupId, artifactId);

      // V3 API: Determine latest version from the versions list
      // The latest version is typically the last one in the list, or we can use createdOn
      const versions = versionsResult.versions || [];
      const latestVersion = versions.length > 0 ? versions[versions.length - 1]?.version : null;

      // Process each version
      for (const version of versions) {
        // Get the content for this version
        const content = await client.getArtifactContent(groupId, artifactId, version.version);

        // Convert the content to a string if it's an object
        const schemaContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

        schemas.push({
          artifactId: artifactId,
          messageId: artifactId,
          version: version.version,
          globalId: version.globalId,
          schemaType: artifactType as SchemaType,
          schema: schemaContent,
          latestVersion: version.version === latestVersion,
          groupId,
        });
      }
    } catch (error) {
      console.error(`Error fetching versions for artifact ${artifactId}:`, error);
    }
  }

  return schemas;
};

export const getLatestVersionFromArtifact = async (registryUrl: string, artifactId: string): Promise<{ version: string }> => {
  const client = new ApicurioClient(registryUrl);

  // Search for the artifact
  const artifactData = await client.getArtifactByName(artifactId);

  if (!artifactData) {
    throw new Error(`Artifact ${artifactId} not found`);
  }

  return {
    version: artifactData.latestVersion,
  };
};

/**
 * Fetch a specification artifact from the registry
 * If version is not provided or is 'latest', fetches the latest version
 */
export const getSpecificationArtifact = async (
  registryUrl: string,
  artifactId: string,
  version?: string
): Promise<{ content: string; version: string; artifactType: string } | null> => {
  const client = new ApicurioClient(registryUrl);

  // Treat 'latest' the same as undefined (fetch latest version)
  const effectiveVersion = version && version.toLowerCase() !== 'latest' ? version : undefined;

  try {
    if (effectiveVersion) {
      // Fetch specific version
      const artifactData = await client.getArtifactByNameAndVersion(artifactId, effectiveVersion);
      if (!artifactData) {
        console.warn(`Specification artifact '${artifactId}' version '${effectiveVersion}' not found in registry`);
        return null;
      }
      const content =
        typeof artifactData.content === 'string' ? artifactData.content : JSON.stringify(artifactData.content, null, 2);
      return {
        content,
        version,
        artifactType: artifactData.artifact.artifactType || artifactData.artifact.type || 'OPENAPI',
      };
    } else {
      // Fetch latest version
      const artifactData = await client.getArtifactByName(artifactId);
      if (!artifactData) {
        console.warn(`Specification artifact '${artifactId}' not found in registry`);
        return null;
      }
      const content =
        typeof artifactData.content === 'string' ? artifactData.content : JSON.stringify(artifactData.content, null, 2);
      return {
        content,
        version: artifactData.latestVersion,
        artifactType: artifactData.artifact.artifactType || artifactData.artifact.type || 'OPENAPI',
      };
    }
  } catch (error) {
    console.error(`Error fetching specification artifact ${artifactId}:`, error);
    return null;
  }
};
