import { Options, defineConfig } from 'tsup';

export function createTsupConfig(options?: Partial<Options>) {
  return defineConfig({
    target: 'es2020',
    format: ['cjs', 'esm'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    ...options,
  });
}
