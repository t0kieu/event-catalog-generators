import { Schema, Filter, MessageType } from '../types';

type GroupedSchemas = {
  [key: string]: Schema[];
};

/**
 * Filters schemas based on provided filter rules for Azure Schema Registry.
 * Matches schemas by id and schemaGroup and returns all versions of each matched schema.
 */
export const filterSchemas = (groupedSchemas: GroupedSchemas, filters: Filter[]): (Schema & { messageType: MessageType })[] => {
  const allSchemas: (Schema & { messageType: MessageType })[] = [];

  for (const filter of filters) {
    const { id, schemaGroup, messageType = 'event' } = filter;

    // Create a unique key for this schema group and name combination
    const schemaKey = `${schemaGroup}:${id}`;
    const schemas = groupedSchemas[schemaKey];

    if (!schemas) {
      continue;
    }

    // Return all versions of this schema
    for (const schema of schemas) {
      allSchemas.push({
        ...schema,
        messageType,
      });
    }
  }

  return allSchemas;
};
