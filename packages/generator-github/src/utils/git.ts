import { execSync } from 'child_process';

export const cloneRepo = async (source: string, destination: string, branch?: string, path?: string) => {
  // Clone the repo without checking out the files
  await execSync(`git clone --no-checkout ${source} ${destination}`);

  if (path) {
    // Sparse checkout the content
    await execSync(`git sparse-checkout init`, { cwd: destination });
    await execSync(`git sparse-checkout set ${path}`, { cwd: destination });
  }

  // Sparse checkout the content
  await execSync(`git sparse-checkout init`, { cwd: destination });

  const gitPaths = [path].map((p) => p?.replace(/\\/g, '/'));

  await execSync(`git sparse-checkout set ${gitPaths.join(' ')} --no-cone`, { cwd: destination });

  // // Checkout the branch
  await execSync(`git checkout ${branch || 'main'}`, { cwd: destination });
};
