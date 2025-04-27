export type EventCatalogConfig = any;

export type Filter = {
  topic?: string | string[];
  prefix?: string | string[];
  suffix?: string | string[];
  includes?: string | string[];
};

export type Service = {
  id: string;
  sends?: Filter[];
  receives?: Filter[];
  version: string;
};

export enum SchemaType {
  JSON = 'JSON',
  PROTOBUF = 'PROTOBUF',
  AVRO = 'avsc',
}

export type Schema = {
  subject: string;
  eventId: string;
  version: number;
  id: number;
  schemaType: SchemaType;
  schema: string;
  latestVersion?: boolean;
};

export type Domain = {
  id: string;
  name: string;
  version: string;
};

export type GeneratorProps = {
  licenseKey?: string;
  /**
   * URL of the Confluent Schema Registry
   */
  url: string;

  /**
   * Include all versions of the schemas in the catalog
   */
  includeAllVersions?: boolean;

  /**
   * Optional list of services to add to the catalog
   */
  services?: Service[];

  /**
   * Optional domain to add to the catalog and attach the services too
   */
  domain?: Domain;
};
