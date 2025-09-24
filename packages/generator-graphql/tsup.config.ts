import { createTsupConfig } from '../../configs/tsup/base';

export default createTsupConfig({
  entry: ['src/*', '!src/test/*', '!src/docs.ts'],
});
