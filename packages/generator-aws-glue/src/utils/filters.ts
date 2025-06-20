import { GlueSchema, Filter } from '../types';

const createFilterFunction = (filterKey: 'schemaName' | 'prefix' | 'suffix' | 'dataFormat' | 'registryName') => {
  return (filters: Filter[]) => {
    return (schemas: GlueSchema[]) => {
      if (!filters.some((filter) => filter[filterKey])) {
        return []; // if no filters for this key, return empty array
      }
      return schemas.reduce((acc: GlueSchema[], schema) => {
        filters.forEach((filter) => {
          if (!filter[filterKey]) return;
          const filterValues = Array.isArray(filter[filterKey]) ? filter[filterKey] : [filter[filterKey]];
          const isMatch = filterValues.some((value) => {
            switch (filterKey) {
              case 'schemaName':
                return schema.name.toLowerCase() === value.toLowerCase();
              case 'prefix':
                return schema.name.startsWith(value);
              case 'suffix':
                return schema.name.endsWith(value);
              case 'dataFormat':
                return schema.dataFormat?.toLowerCase() === value.toLowerCase();
              case 'registryName':
                return schema.registryName.toLowerCase() === value.toLowerCase();
            }
          });
          if (isMatch) {
            acc.push({ ...schema });
          }
        });
        return acc;
      }, []);
    };
  };
};

const filterByIncludes = (filters: Filter[]) => {
  return (schemas: GlueSchema[]) => {
    const includesFilters = filters.filter((filter) => filter.includes);
    if (includesFilters.length === 0) return [];

    return schemas.reduce((acc: GlueSchema[], schema) => {
      includesFilters.forEach((filter) => {
        if (filter.includes) {
          const includesValues = Array.isArray(filter.includes) ? filter.includes : [filter.includes];
          const isMatch = includesValues.some((value) => schema.name.toLowerCase().includes(value.toLowerCase()));
          if (isMatch) {
            acc.push({ ...schema });
          }
        }
      });
      return acc;
    }, []);
  };
};

const filterByTags = (filters: Filter[]) => {
  return (schemas: GlueSchema[]) => {
    const tagFilters = filters.filter((filter) => filter.tags);
    if (tagFilters.length === 0) return [];

    return schemas.reduce((acc: GlueSchema[], schema) => {
      tagFilters.forEach((filter) => {
        if (filter.tags && schema.tags) {
          const hasMatchingTags = Object.entries(filter.tags).every(([key, value]) => {
            return schema.tags?.[key] === value;
          });
          if (hasMatchingTags) {
            acc.push({ ...schema });
          }
        }
      });
      return acc;
    }, []);
  };
};

const bySchemaName = createFilterFunction('schemaName');
const byPrefix = createFilterFunction('prefix');
const bySuffix = createFilterFunction('suffix');
const byDataFormat = createFilterFunction('dataFormat');
const byRegistryName = createFilterFunction('registryName');

export const filterSchemas = (schemas: GlueSchema[], filters: Filter[]) => {
  const filterFunctions = [bySchemaName, byPrefix, bySuffix, byDataFormat, byRegistryName, filterByIncludes, filterByTags];
  const filteredResults = filterFunctions.map((filterFn) => filterFn(filters)(schemas));

  return filteredResults.reduce((acc, curr) => {
    return acc.concat(curr.filter((schema) => !acc.find((existing) => existing.id === schema.id)));
  }, []);
};
