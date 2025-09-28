export interface Service {
  id: string;
  path: string;
  version: string;
  draft?: boolean;
  name?: string;
  owners?: string[];
  generateMarkdown?: (args: any) => string;
}

export interface Domain {
  id: string;
  name: string;
  version: string;
  markdown?: string;
}

export interface Message {
  id: string;
  name?: string;
  version?: string;
}

export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';
