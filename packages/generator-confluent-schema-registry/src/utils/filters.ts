import { Schema } from '../types';

type Filter = {
  topic?: string | string[];
  prefix?: string | string[];
  suffix?: string | string[];
  includes?: string | string[];
};

type GroupedSchemas = {
  [key: string]: Schema[];
};

export const filterSchemas = (groupedSchemas: GroupedSchemas, filters: Filter[]) => {
  // topic can be order-created-value, strip off the -value
  const topics = Object.keys(groupedSchemas).map((v) => v.replace('-value', ''));
  const filteredTopics = topics.filter((topicName) => {
    return filters.some((filter) => {
      // Handle topic filter
      if (filter.topic) {
        const topicArray = Array.isArray(filter.topic) ? filter.topic : [filter.topic];
        if (topicArray.some((topic) => topic === topicName)) return true;
      }

      // Handle prefix filter
      if (filter.prefix) {
        const prefixArray = Array.isArray(filter.prefix) ? filter.prefix : [filter.prefix];
        if (prefixArray.some((prefix) => topicName.startsWith(prefix))) return true;
      }

      // Handle suffix filter
      if (filter.suffix) {
        const suffixArray = Array.isArray(filter.suffix) ? filter.suffix : [filter.suffix];
        if (suffixArray.some((suffix) => topicName.endsWith(suffix))) return true;
      }

      if (filter.includes) {
        const includesArray = Array.isArray(filter.includes) ? filter.includes : [filter.includes];
        if (includesArray.some((include) => topicName.includes(include))) return true;
      }

      return false;
    });
  });

  if (filteredTopics.length === 0) {
    return [];
  }

  // Find the latestVersion for each topic
  const latestVersions = filteredTopics.map((topic) => {
    return groupedSchemas[`${topic}-value`].find((schema) => schema.latestVersion);
  });

  return latestVersions;
};
