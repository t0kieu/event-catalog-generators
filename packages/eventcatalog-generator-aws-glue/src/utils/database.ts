import { GlueTable, GeneratorProps } from '../types';

const getDatabaseURL = (table: GlueTable) => {
  const baseURL = `https://${table.region}.console.aws.amazon.com`;
  return `${baseURL}/glue/home?region=${table.region}#/v2/data-catalog/databases/view/${table.databaseName}`;
};

const getTablesURL = (table: GlueTable) => {
  const baseURL = `https://${table.region}.console.aws.amazon.com`;
  return `${baseURL}/glue/home?region=${table.region}#/v2/data-catalog/databases/${table.databaseName}/tables`;
};

const getCrawlersURL = (table: GlueTable) => {
  const baseURL = `https://${table.region}.console.aws.amazon.com`;
  return `${baseURL}/glue/home?region=${table.region}#/v2/etl-configuration/crawlers`;
};

export const generatedMarkdownByDatabase = (table: GlueTable, options: GeneratorProps) => {
  return `
  
  ## Overview
  
  Documentation for the AWS Glue Database: ${table.databaseName}.
  
  This database contains table schemas and metadata that can be used by AWS Glue ETL jobs, 
  Amazon Athena, Amazon Redshift Spectrum, and other AWS analytics services.
  
  <Tiles >
      <Tile icon="GlobeAltIcon" href="${getDatabaseURL(table)}" openWindow={true} title="Open database" description="Open the ${table.databaseName} database in the AWS Glue console" />
      <Tile icon="TableCellsIcon" href="${getTablesURL(table)}" openWindow={true} title="View all tables" description="Browse all tables in the ${table.databaseName} database" />
      <Tile icon="CogIcon" href="${getCrawlersURL(table)}" openWindow={true} title="Manage crawlers" description="View and manage AWS Glue crawlers for this database" />
  </Tiles>  

  ## Database Information

  **Region:** ${options.region}
  **Catalog ID:** ${table.catalogId || 'Default'}

  `;
};
