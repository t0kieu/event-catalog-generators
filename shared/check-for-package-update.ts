import boxen from 'boxen';
import fs from 'fs';
import path from 'path';

const getInstalledVersionOfPackage = (packageName: string) => {
  try {
    const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();
    const pkg = fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8');
    const json = JSON.parse(pkg);
    const version = json.dependencies[packageName];
    // Clean up the version string by removing ^, ~ and other special characters
    return version?.replace(/[\^~><=]/g, '');
  } catch (error) {
    return null;
  }
};

export async function checkForPackageUpdate(packageName: string) {
  const installedVersion = getInstalledVersionOfPackage(packageName);

  if (!installedVersion || installedVersion === 'latest') return;

  try {
    const pkg = { name: packageName, version: installedVersion };
    const updateNotifierModule = await import('update-notifier');
    const notifier = updateNotifierModule.default({ pkg, updateCheckInterval: 0, shouldNotifyInNpmScript: true });

    const info = await notifier.fetchInfo();

    if (info?.type !== 'latest') {
      const message = `Package ${packageName} update available ${info.current} → ${info.latest}
Run npm i ${packageName} to update`;

      console.log(
        boxen(message, {
          padding: 1,
          margin: 1,
          align: 'center',
          borderColor: 'yellow',
          borderStyle: {
            topLeft: ' ',
            topRight: ' ',
            bottomLeft: ' ',
            bottomRight: ' ',
            right: ' ',
            top: '-',
            bottom: '-',
            left: ' ',
          },
        })
      );
    }
  } catch (error) {
    // Silently ignore update check failures (common in bundled environments)
    // This prevents the ERR_INVALID_ARG_TYPE error when update-notifier's
    // dependencies can't properly resolve file paths in bundled code
  }
}
