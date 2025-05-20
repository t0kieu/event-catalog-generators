import { satisfies } from 'semver';

// version is greater than or equal to the given version
export const isVersionGreaterThan = (version: string, givenVersion: string) => {
  return satisfies(version, `>${givenVersion}`);
};

// version is less than or equal to the given version
export const isVersionLessThan = (version: string, givenVersion: string) => {
  return satisfies(version, `<${givenVersion}`);
};
