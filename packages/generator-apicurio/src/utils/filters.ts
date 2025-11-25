import { Schema, Filter, MessageType } from '../types';

type GroupedSchemas = {
  [key: string]: Schema[];
};

/**
 * Checks if a message name matches a given filter criterion.
 */
const matchesFilterCriterion = (messageName: string, criterion: Filter['events'] | Filter['commands']): boolean => {
  if (!criterion) return false;

  // Exact match (string)
  if (typeof criterion === 'string') return messageName === criterion;

  // Exact match (array of strings)
  if (Array.isArray(criterion) && criterion.every((item) => typeof item === 'string')) {
    return criterion.includes(messageName);
  }

  // Object-based filters (prefix, suffix, includes)
  if (typeof criterion === 'object' && !Array.isArray(criterion)) {
    const checkCondition = (value: string | string[] | undefined, checkFn: (item: string) => boolean): boolean => {
      if (!value) return false;
      const items = Array.isArray(value) ? value : [value];
      return items.some(checkFn);
    };
    return (
      checkCondition(criterion.exact, (exact) => messageName === exact) ||
      checkCondition(criterion.prefix, (prefix) => messageName.startsWith(prefix)) ||
      checkCondition(criterion.suffix, (suffix) => messageName.endsWith(suffix)) ||
      checkCondition(criterion.includes, (include) => messageName.includes(include))
    );
  }

  return false;
};

/**
 * Filters schemas based on provided filter rules, determines their type (event/command),
 * and returns schemas augmented with their type.
 * When includeAllVersions is true, returns all versions sorted from oldest to newest.
 * Otherwise, returns only the latest version of each matched schema.
 */
export const filterSchemas = (
  groupedSchemas: GroupedSchemas,
  filters: Filter[],
  includeAllVersions: boolean = false
): (Schema & { messageType: MessageType })[] => {
  const allMessageKeys = Object.keys(groupedSchemas);
  const uniqueMessageNames = [...new Set(allMessageKeys)];

  const filteredMessages: { messageName: string; messageType: MessageType }[] = [];

  for (const messageName of uniqueMessageNames) {
    let assignedType: MessageType | null = null;

    for (const filter of filters) {
      if (assignedType) break;

      if (filter.events && matchesFilterCriterion(messageName, filter.events)) {
        assignedType = 'event';
      } else if (filter.commands && matchesFilterCriterion(messageName, filter.commands)) {
        assignedType = 'command';
      } else if (filter.queries && matchesFilterCriterion(messageName, filter.queries)) {
        assignedType = 'query';
      }
    }

    if (assignedType) {
      filteredMessages.push({ messageName, messageType: assignedType });
    }
  }

  if (filteredMessages.length === 0) {
    return [];
  }

  if (includeAllVersions) {
    // Return all versions sorted from oldest to newest (by version number)
    const allVersionSchemas = filteredMessages
      .flatMap(({ messageName, messageType }) => {
        const schemas = groupedSchemas[messageName] || [];
        return schemas.map((schema) => ({ ...schema, messageType }));
      })
      .sort((a, b) => {
        // Sort by artifactId first, then by version
        if (a.artifactId !== b.artifactId) return a.artifactId.localeCompare(b.artifactId);
        return parseInt(a.version) - parseInt(b.version);
      });

    return allVersionSchemas;
  }

  // Return only the latest version of each schema
  const latestVersionSchemas = filteredMessages
    .map(({ messageName, messageType }) => {
      const schemas = groupedSchemas[messageName];
      const latestSchema = schemas?.find((schema) => schema.latestVersion);

      return latestSchema ? { ...latestSchema, messageType } : undefined;
    })
    .filter((schema): schema is Schema & { messageType: MessageType } => schema !== undefined);

  return latestVersionSchemas;
};
