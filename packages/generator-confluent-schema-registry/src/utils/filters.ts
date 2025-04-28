import { Schema, Filter, MessageType } from '../types';

type GroupedSchemas = {
  [key: string]: Schema[];
};

/**
 * Checks if a message name matches a given filter criterion.
 * Criterion can be an exact string match, one of an array of strings,
 * or match based on prefix, suffix, or includes conditions defined in an object.
 */
const matchesFilterCriterion = (
  messageName: string,
  criterion: Filter['events'] | Filter['commands'] // Use specific types from Filter interface
): boolean => {
  if (!criterion) return false;

  // Exact match (string)
  if (typeof criterion === 'string') return messageName === criterion;

  // Exact match (array of strings)
  // Ensure it's an array and all elements are strings before checking includes
  if (Array.isArray(criterion) && criterion.every((item) => typeof item === 'string')) {
    return criterion.includes(messageName);
  }

  // Object-based filters (prefix, suffix, includes)
  // Ensure it's an object and not an array
  if (typeof criterion === 'object' && !Array.isArray(criterion)) {
    // Helper to check conditions (prefix, suffix, includes) against string or array values
    const checkCondition = (value: string | string[] | undefined, checkFn: (item: string) => boolean): boolean => {
      if (!value) return false;
      const items = Array.isArray(value) ? value : [value];
      return items.some(checkFn);
    };
    // Return true if any of the conditions match
    return (
      checkCondition(criterion.prefix, (prefix) => messageName.startsWith(prefix)) ||
      checkCondition(criterion.suffix, (suffix) => messageName.endsWith(suffix)) ||
      checkCondition(criterion.includes, (include) => messageName.includes(include))
    );
  }

  // Return false if criterion format is unexpected or no match found
  return false;
};

/**
 * Filters schemas based on provided filter rules, determines their type (event/command),
 * and returns the latest version of each matched schema augmented with its type.
 */
export const filterSchemas = (groupedSchemas: GroupedSchemas, filters: Filter[]): (Schema & { messageType: MessageType })[] => {
  // Get all keys (e.g., 'order-created-value') and derive unique message names (e.g., 'order-created')
  const allMessageKeys = Object.keys(groupedSchemas);
  const uniqueMessageNames = [...new Set(allMessageKeys.map((key) => key.replace(/-value$/, '')))];

  const filteredMessages: { messageName: string; messageType: MessageType; topic?: string }[] = [];

  // Determine the type ('event' or 'command') for each unique message name based on the filters
  for (const messageName of uniqueMessageNames) {
    let assignedType: MessageType | null = null;
    let assignedTopic: string | null = null;
    // Iterate through filters to find the first matching rule
    for (const filter of filters) {
      if (assignedType) break; // Stop checking filters once a type is assigned

      if (filter.events && matchesFilterCriterion(messageName, filter.events)) {
        assignedType = 'event';
      } else if (filter.commands && matchesFilterCriterion(messageName, filter.commands)) {
        // Assign as command only if not already assigned as event
        assignedType = 'command';
      }

      if (filter?.topic) {
        assignedTopic = filter.topic;
      }
    }

    // If a type was assigned, add it to our list of filtered messages
    if (assignedType) {
      filteredMessages.push({ messageName, messageType: assignedType, topic: assignedTopic || undefined });
    }
  }

  // If no messages matched the filters, return an empty array
  if (filteredMessages.length === 0) {
    return [];
  }

  // For each filtered message, find its latest schema and augment it with the messageType
  const latestVersionSchemas = filteredMessages
    .map(({ messageName, messageType, topic }) => {
      // Access the group of schemas for the message (e.g., groupedSchemas['order-created-value'])
      const schemas = groupedSchemas[`${messageName}-value`];
      // Find the specific schema marked as the latest version
      const latestSchema = schemas?.find((schema) => schema.latestVersion);

      // If a latest schema exists, return it with the messageType added
      // Otherwise, return undefined (will be filtered out)
      return latestSchema ? { ...latestSchema, messageType, topic } : undefined;
    })
    // Remove any entries where a latest schema wasn't found
    .filter((schema): schema is Schema & { messageType: MessageType; topic: string | undefined } => schema !== undefined); // Type guard ensures correct final type

  return latestVersionSchemas;
};
