import { Schema, Service } from '../types';
import { getSchemaFileName } from './topics';

export const getMarkdownForSchema = (schema: Schema) => {
  const schemaFileName = getSchemaFileName(schema);
  return `
    
    <NodeGraph />
  
  <Schema file="${schemaFileName}" />
    `;
};

export const getMarkdownForService = (service: Service) => {
  return `
  ## Architecture diagram
  <NodeGraph />
  `;
};
