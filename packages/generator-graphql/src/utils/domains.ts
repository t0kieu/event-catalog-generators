import { Domain } from '../types';

export const defaultMarkdown = ({ domain }: { domain: Domain }) => {
  return `# ${domain.name}

This domain was generated from a GraphQL schema.

${domain.markdown || ''}`;
};
