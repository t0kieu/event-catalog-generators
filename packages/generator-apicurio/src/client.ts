import axios, { AxiosInstance } from 'axios';
import { ArtifactSearchResults, VersionSearchResults, ArtifactWithVersions } from './types';

export class ApicurioClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    // Ensure the base URL ends with the v3 API path
    // Users can provide just the registry URL (e.g., http://localhost:8080)
    // and we'll append the API path automatically
    const normalizedUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const apiPath = '/apis/registry/v3';

    // Only append if not already present
    this.baseUrl = normalizedUrl.includes('/apis/registry/') ? normalizedUrl : `${normalizedUrl}${apiPath}`;

    // Build headers object
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if APICURIO_ACCESS_TOKEN is set
    const accessToken = process.env.APICURIO_ACCESS_TOKEN;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
    });
  }

  async searchArtifacts(limit: number = 100, offset: number = 0): Promise<ArtifactSearchResults> {
    const response = await this.client.get('/search/artifacts', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getArtifactMetadata(groupId: string, artifactId: string): Promise<any> {
    // V3 API: metadata is at /groups/{groupId}/artifacts/{artifactId}
    const response = await this.client.get(`/groups/${groupId}/artifacts/${artifactId}`);
    return response.data;
  }

  async getArtifactVersions(groupId: string, artifactId: string): Promise<VersionSearchResults> {
    const response = await this.client.get(`/groups/${groupId}/artifacts/${artifactId}/versions`);
    return response.data;
  }

  async getArtifactVersionMetadata(groupId: string, artifactId: string, version: string): Promise<any> {
    // V3 API: version metadata is at /groups/{groupId}/artifacts/{artifactId}/versions/{versionExpression}
    const response = await this.client.get(`/groups/${groupId}/artifacts/${artifactId}/versions/${version}`);
    return response.data;
  }

  async getArtifactContent(groupId: string, artifactId: string, version?: string): Promise<any> {
    // V3 API: content is at /groups/{groupId}/artifacts/{artifactId}/versions/{versionExpression}/content
    // Use 'branch=latest' to get the latest version
    const versionExpr = version || 'branch=latest';
    const url = `/groups/${groupId}/artifacts/${artifactId}/versions/${versionExpr}/content`;
    const response = await this.client.get(url);
    return response.data;
  }

  async getArtifactByName(artifactId: string): Promise<ArtifactWithVersions | null> {
    try {
      // Search for the artifact across all groups with pagination
      let artifact = null;
      let offset = 0;
      const limit = 100;

      while (!artifact) {
        const searchResults = await this.searchArtifacts(limit, offset);

        if (!searchResults.artifacts || searchResults.artifacts.length === 0) {
          // No more results, artifact not found
          return null;
        }

        // V3 uses 'artifactId', V2 uses 'id'
        artifact = searchResults.artifacts.find((a) => (a.artifactId || a.id) === artifactId);

        if (!artifact) {
          // Check if there are more results to fetch
          if (searchResults.artifacts.length < limit) {
            // Last page reached, artifact not found
            return null;
          }
          // Move to next page
          offset += limit;
        }
      }

      const groupId = artifact.groupId || 'default';
      const resolvedArtifactId = artifact.artifactId || artifact.id || artifactId;

      // Get all versions
      const versions = await this.getArtifactVersions(groupId, resolvedArtifactId);

      // V3: Get latest version from versions list instead of metadata
      const latestVersion = versions.versions?.length > 0 ? versions.versions[versions.versions.length - 1]?.version : '1';

      // Get latest content
      const content = await this.getArtifactContent(groupId, resolvedArtifactId);

      return {
        artifact,
        versions: versions.versions || [],
        latestVersion,
        content,
      };
    } catch (error) {
      console.error(`Error fetching artifact ${artifactId}:`, error);
      return null;
    }
  }

  async getArtifactByNameAndVersion(artifactId: string, version: string): Promise<ArtifactWithVersions | null> {
    try {
      // Search for the artifact with pagination
      let artifact = null;
      let offset = 0;
      const limit = 100;

      while (!artifact) {
        const searchResults = await this.searchArtifacts(limit, offset);

        if (!searchResults.artifacts || searchResults.artifacts.length === 0) {
          // No more results, artifact not found
          return null;
        }

        // V3 uses 'artifactId', V2 uses 'id'
        artifact = searchResults.artifacts.find((a) => (a.artifactId || a.id) === artifactId);

        if (!artifact) {
          // Check if there are more results to fetch
          if (searchResults.artifacts.length < limit) {
            // Last page reached, artifact not found
            return null;
          }
          // Move to next page
          offset += limit;
        }
      }

      const groupId = artifact.groupId || 'default';
      const resolvedArtifactId = artifact.artifactId || artifact.id || artifactId;

      // Get all versions
      const versions = await this.getArtifactVersions(groupId, resolvedArtifactId);

      // Get specific version content
      const content = await this.getArtifactContent(groupId, resolvedArtifactId, version);

      return {
        artifact,
        versions: versions.versions || [],
        latestVersion: version,
        content,
      };
    } catch (error) {
      console.error(`Error fetching artifact ${artifactId} version ${version}:`, error);
      return null;
    }
  }
}
