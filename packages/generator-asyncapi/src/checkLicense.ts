import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import chalk from 'chalk';
import pkg from '../package.json';

type LicenseResponse = {
  is_trial: boolean;
  plugin: string;
  state: string;
};

export default async (licenseKey?: string) => {
  const LICENSE_KEY = process.env.EVENTCATALOG_LICENSE_KEY_ASYNCAPI || licenseKey || null;
  const PROXY_SERVER_URI = process.env.PROXY_SERVER_URI || null;

  if (!LICENSE_KEY) {
    console.log(chalk.bgRed(`\nThis plugin requires a license key to use`));
    console.log(chalk.redBright(`\nVisit https://eventcatalog.cloud/ to get a 14 day trial or purchase a license`));
    process.exit(1);
  }

  // Verify the license key
  const fetchOptions: any = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LICENSE_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  let response: any;
  try {
    if (PROXY_SERVER_URI) {
      const proxyAgent = new HttpsProxyAgent(PROXY_SERVER_URI);
      fetchOptions.agent = proxyAgent;
    }
    response = await fetch('https://api.eventcatalog.cloud/functions/v1/license', fetchOptions);
  } catch (err: any) {
    console.log(
      chalk.redBright(
        'Network Connection Error: Unable to establish a connection to licence server. Check network or proxy settings.'
      )
    );
    console.log(chalk.red(`Error details: ${err?.message || err}`));
    process.exit(1);
  }

  if (response.status !== 200) {
    console.log(chalk.bgRed(`\nInvalid license key`));
    console.log(chalk.redBright('Please check your plugin license key or purchase a license at https://eventcatalog.cloud/'));
    process.exit(1);
  }

  if (response.status === 200) {
    const data = (await response.json()) as LicenseResponse;

    if (pkg.name !== data.plugin) {
      console.log(chalk.bgRed(`\nInvalid license key for this plugin`));
      console.log(chalk.redBright('Please check your plugin license key or purchase a license at https://eventcatalog.cloud/'));
      process.exit(1);
    }

    if (data.is_trial) {
      console.log(chalk.bgBlue(`\nYou are using a trial license for this plugin`));
    }
  }

  return Promise.resolve();
};
