import chalk from 'chalk';
import { isFeatureEnabled, hasOfflineLicenseKey } from '@eventcatalog/license';

export default async (pkgName: string, licenseKey?: string) => {
  if (!hasOfflineLicenseKey() && !licenseKey) {
    console.log(chalk.bgRed(`\nNo license key provided for ${pkgName}`));
    console.log(chalk.redBright('You can get a free 14 day trial license at https://eventcatalog.cloud/'));
    process.exit(1);
  }

  try {
    const featureEnabled = await isFeatureEnabled(pkgName, licenseKey);
    if (!featureEnabled) {
      console.log(chalk.bgRed(`\nInvalid license key`));
      console.log(chalk.redBright('Please check your plugin license key or purchase a license at https://eventcatalog.cloud/'));
      process.exit(1);
    }
    return Promise.resolve();
  } catch (error) {
    console.log(error);
    console.log(chalk.bgRed(`\nFailed to verify license key`));
    console.log(chalk.redBright('Please check your plugin license key or purchase a license at https://eventcatalog.cloud/'));
    process.exit(1);
  }
};
