import boxen from 'boxen';
import updateNotifier from 'update-notifier';
import fs from 'fs';
import { join } from 'path';

const getInstalledVersionOfPackage = (packageName: string) => {
  try {
    const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();
    const pkg = fs.readFileSync(join(PROJECT_DIR, 'package.json'), 'utf8');
    const json = JSON.parse(pkg);
    return json.dependencies[packageName];
  } catch (error) {
    return null;
  }
};

export async function checkForPackageUpdate(packageName: string) {
  const installedVersion = getInstalledVersionOfPackage(packageName);

  if (!installedVersion) return;

  const pkg = { name: packageName, version: '3.0.0' };
  const notifier = updateNotifier({ pkg, updateCheckInterval: 0, shouldNotifyInNpmScript: true });
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
}
