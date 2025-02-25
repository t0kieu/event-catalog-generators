import { expect, it, describe, beforeEach, vi } from 'vitest';
import plugin from '../index';
import path, { join } from 'node:path';
import fs from 'fs/promises';
// Fake eventcatalog config
const eventCatalogConfig = {
  title: 'My EventCatalog',
};

let catalogDir: string;

// Add mock for the local checkLicense module
vi.mock('../utils/checkLicense', () => ({
  default: () => Promise.resolve(),
}));

describe('generator-ai', () => {
  beforeEach(async () => {
    catalogDir = join(__dirname, 'catalog') || '';
    process.env.PROJECT_DIR = catalogDir;
  });

  describe(
    'splitMarkdownFiles',
    () => {
      it('when splitMarkdownFiles is true the markdown is split into smaller chunks', async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: true,
        });

        //  Find all objects with metadata.id = PaymentProcessed, should have 8 of them
        const documents = await fs.readFile(path.join(catalogDir, 'generated-ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const paymentProcessed = documentsJson.filter((document: any) => document.metadata.id === 'PaymentProcessed');
        expect(paymentProcessed).toHaveLength(8);
      });
    },
    { timeout: 20000 }
  );

  it(
    'The plugin does not split the markdown into smaller chunks when splitMarkdownFiles is false',
    async () => {
      await plugin(eventCatalogConfig, {
        splitMarkdownFiles: false,
      });

      //  Find all objects with metadata.id = PaymentProcessed, should have 8 of them
      const documents = await fs.readFile(path.join(catalogDir, 'generated-ai/documents.json'), 'utf8');
      const documentsJson = JSON.parse(documents);
      const paymentProcessed = documentsJson.filter((document: any) => document.metadata.id === 'PaymentProcessed');
      expect(paymentProcessed).toHaveLength(2);
    },
    { timeout: 20000 }
  );

  it(
    'The plugin generates embeddings and documents, and a readme for the given catalog',
    async () => {
      await plugin(eventCatalogConfig, {
        splitMarkdownFiles: true,
      });

      const files = await fs.readdir(path.join(catalogDir, 'generated-ai'));
      expect(files).toContain('embeddings.json');
      expect(files).toContain('documents.json');
      expect(files).toContain('README.md');
    },
    { timeout: 20000 }
  );

  it(
    'The generated-ai folder is added to the .gitignore file',
    async () => {
      await plugin(eventCatalogConfig, {
        splitMarkdownFiles: true,
      });

      const gitignore = await fs.readFile(path.join(catalogDir, '.gitignore'), 'utf8');
      expect(gitignore).toContain('generated-ai/');
    },
    { timeout: 20000 }
  );
});
