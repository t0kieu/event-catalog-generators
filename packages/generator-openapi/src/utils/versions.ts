import { satisfies } from 'semver';

// version is greater than or equal to the given version
export const isVersionGreaterThanOrEqualTo = (version: string, givenVersion: string) => {
  return satisfies(version, `>=${givenVersion}`);
};

// version is less than or equal to the given version
export const isVersionLessThanOrEqualTo = (version: string, givenVersion: string) => {
  return satisfies(version, `<=${givenVersion}`);
};
