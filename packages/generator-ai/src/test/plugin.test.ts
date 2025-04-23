import { expect, it, describe, beforeEach, vi } from 'vitest';
import plugin from '../index';
import path, { join } from 'node:path';
import fs from 'fs/promises';
import os from 'node:os';
// No longer importing the original openai directly in the test file

// Fake eventcatalog config
const eventCatalogConfig = {
  title: 'My EventCatalog',
};

let catalogDir: string;

// Add mock for the local checkLicense module
vi.mock('../utils/checkLicense', () => ({
  default: () => Promise.resolve(),
}));

// 1. Fake API key before importing the module
process.env.OPENAI_API_KEY = 'fake-key';

vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    data: [{ embedding: [1, 2, 3] }],
  });
  return {
    // Mock the default export (the OpenAI class constructor)
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: mockCreate,
      },
    })),
    // Export the mock function itself so we can access it in tests
    __esModule: true, // Required when mocking modules with default/named exports this way
    mockEmbeddingsCreate: mockCreate,
  };
});

import * as OpenAIMock from 'openai';
const { mockEmbeddingsCreate } = OpenAIMock as any;

describe('generator-ai', () => {
  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'FAKE_KEY';
    catalogDir = join(__dirname, 'catalog') || '';
    process.env.PROJECT_DIR = catalogDir;
  });

  describe('splitMarkdownFiles', () => {
    it(
      'when splitMarkdownFiles is true the markdown is split into smaller chunks',
      async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: true,
        });

        //  Find all objects with metadata.id = PaymentProcessed
        const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const paymentProcessed = documentsJson.filter((document: any) => document.metadata.id === 'PaymentProcessed');
        const expectedChunks = os.platform() === 'win32' ? 10 : 8;
        expect(paymentProcessed).toHaveLength(expectedChunks);
      },
      { timeout: 20000 }
    );
  });

  it(
    'The plugin does not split the markdown into smaller chunks when splitMarkdownFiles is false',
    async () => {
      await plugin(eventCatalogConfig, {
        splitMarkdownFiles: false,
      });

      //  Find all objects with metadata.id = PaymentProcessed, should have 8 of them
      const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
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

      const files = await fs.readdir(path.join(catalogDir, 'public/ai'));
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
      expect(gitignore).toContain('public/ai/');
    },
    { timeout: 20000 }
  );

  it(
    'If the folder contains no resources, the generator still runs and does not throw an error',
    async () => {
      // Set the catalog dir to a new folder
      catalogDir = join(__dirname, 'catalog-no-resources');
      process.env.PROJECT_DIR = catalogDir;

      await plugin(eventCatalogConfig, {
        splitMarkdownFiles: true,
      });

      const files = await fs.readdir(path.join(catalogDir, 'public/ai'));
      expect(files).toContain('embeddings.json');
      expect(files).toContain('documents.json');
      expect(files).toContain('README.md');
    },
    { timeout: 20000 }
  );

  describe('includeUsersAndTeams', () => {
    it(
      'when includeUsersAndTeams is true the users and teams are included in the embeddings',
      async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: false,
          includeUsersAndTeams: true,
        });

        const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const fullStackTeam = documentsJson.filter((document: any) => document.metadata.id === 'full-stack');
        const userExample = documentsJson.filter((document: any) => document.metadata.id === 'dboyne');
        expect(fullStackTeam).toHaveLength(1);
        expect(userExample).toHaveLength(1);
      },
      { timeout: 20000 }
    );

    it(
      'when includeUsersAndTeams is false the users and teams are not included in the embeddings',
      async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: false,
          includeUsersAndTeams: false,
        });

        const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const fullStackTeam = documentsJson.filter((document: any) => document.metadata.id === 'full-stack');
        const userExample = documentsJson.filter((document: any) => document.metadata.id === 'dboyne');
        expect(fullStackTeam).toHaveLength(0);
        expect(userExample).toHaveLength(0);
      },
      { timeout: 20000 }
    );
  });

  describe('includeCustomDocumentationPages', () => {
    it(
      'by default the custom documentation pages are included in the embeddings',
      async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: false,
          includeCustomDocumentationPages: true,
        });

        const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const customDocumentationPage = documentsJson.filter(
          (document: any) => document.metadata.type === 'custom-documentation-page'
        );
        expect(customDocumentationPage).toHaveLength(1);
      },
      { timeout: 20000 }
    );

    it(
      'when includeCustomDocumentationPages is false the custom documentation pages are not included in the embeddings',
      async () => {
        await plugin(eventCatalogConfig, {
          splitMarkdownFiles: false,
          includeCustomDocumentationPages: false,
        });

        const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
        const documentsJson = JSON.parse(documents);
        const customDocumentationPage = documentsJson.filter(
          (document: any) => document.metadata.type === 'custom-documentation-page'
        );
        expect(customDocumentationPage).toHaveLength(0);
      },
      { timeout: 20000 }
    );
  });

  describe('embedding', () => {
    beforeEach(() => {
      // Reset the mock before each test
      // Use the imported mock function
      mockEmbeddingsCreate.mockClear();
    });

    it('when the embedding is openai, the embeddings are generated using the openai model', async () => {
      await plugin(eventCatalogConfig, {
        embedding: {
          provider: 'openai',
          model: 'text-embedding-3-large',
        },
      });

      // Verify documents.json and embeddings.json are created
      const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
      const documentsJson = JSON.parse(documents);
      expect(documentsJson).toHaveLength(39);

      const embeddings = await fs.readFile(path.join(catalogDir, 'public/ai/embeddings.json'), 'utf8');
      const embeddingsJson = JSON.parse(embeddings);
      expect(embeddingsJson).toHaveLength(39);

      // Verify the mock was called with the correct model and expected number of times
      // Use the imported mock function
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(39);
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'text-embedding-3-large',
          encoding_format: 'float',
        })
      );
    });

    it('when no embedding provider is provided, the embeddings are generated using the huggingface model', async () => {
      await plugin(eventCatalogConfig, {});

      // Verify documents.json and embeddings.json are created
      const documents = await fs.readFile(path.join(catalogDir, 'public/ai/documents.json'), 'utf8');
      const documentsJson = JSON.parse(documents);
      expect(documentsJson).toHaveLength(39);

      const embeddings = await fs.readFile(path.join(catalogDir, 'public/ai/embeddings.json'), 'utf8');
      const embeddingsJson = JSON.parse(embeddings);
      expect(embeddingsJson).toHaveLength(39);

      // Make sure openai was not called
      expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(0);
    });
  });
});
