import utils from '@eventcatalog/sdk';
import chalk from 'chalk';
import { pipeline } from '@huggingface/transformers';
import fs from 'fs-extra';
import path from 'path';
import { Document } from 'langchain/document';
import { checkForPackageUpdate } from '../../../shared/check-for-package-update';
import pkgJSON from '../package.json';
import { MarkdownTextSplitter } from 'langchain/text_splitter';

// The event.catalog.js values for your plugin
type EventCatalogConfig = any;

// Configuration the users give your catalog
type GeneratorProps = {
  licenseKey?: string;
  splitMarkdownFiles?: boolean;
  embedingModel?: string;
  includeUsersAndTeams?: boolean;
};

// Function to generate embeddings using Hugging Face (Xenova)
async function generateEmbeddings(texts: string[], model = 'Xenova/all-MiniLM-L6-v2'): Promise<number[][]> {
  const embedder = await pipeline('feature-extraction', model);

  console.log(chalk.cyan(`  - Generating embeddings...`));
  const embeddings = await Promise.all(
    texts.map(async (text) => {
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data); // Convert to regular array
    })
  );

  console.log(chalk.green(`  - Embeddings generated successfully!`));
  return embeddings;
}

export default async (_: EventCatalogConfig, options: GeneratorProps) => {
  if (!process.env.PROJECT_DIR) {
    process.env.PROJECT_DIR = process.cwd();
  }

  if (!process.env.PROJECT_DIR) {
    throw new Error('Please provide catalog url (env variable PROJECT_DIR)');
  }

  console.log(chalk.cyan(`@eventcatalog/generator-ai processing your catalog...`));

  // users and teams can bloat the embeddings and may not provide much value, let the user decide if they want to include them
  const includeUsersAndTeams = options.includeUsersAndTeams ?? false;

  // await checkLicense(options.licenseKey);
  await checkForPackageUpdate(pkgJSON.name);

  const { getEvents, getUsers, getServices, getDomains, getCommands, getQueries, getTeams } = utils(process.env.PROJECT_DIR);

  const [events, users, services, domains, commands, queries, teams] = await Promise.all([
    getEvents(),
    includeUsersAndTeams ? getUsers() : [],
    getServices(),
    getDomains(),
    getCommands({}),
    getQueries({}),
    includeUsersAndTeams ? getTeams() : [],
  ]);

  const resourceTypes = [
    { items: events, type: 'event' },
    { items: users, type: 'user' },
    { items: services, type: 'service' },
    { items: domains, type: 'domain' },
    { items: commands, type: 'command' },
    { items: queries, type: 'query' },
    { items: teams, type: 'team' },
  ];

  const resources = resourceTypes.flatMap(({ items, type }) => items.map((item) => ({ ...item, type })));

  let documents: Document[] = [];

  // Split documents using chunks from markdown files
  if (options.splitMarkdownFiles) {
    console.log(chalk.cyan(`  - Splitting markdown documents...`));
    const markdownSplitter = new MarkdownTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    // Process each event and create documents with split content
    // @ts-ignore
    documents = await Promise.all(
      resources.map(async (resource) => {
        const splitDocs = await markdownSplitter.createDocuments(
          [resource.markdown],
          [
            {
              ...resource,
              markdown: undefined,
              loc: undefined,
            },
          ]
        );
        return splitDocs;
      })
    );
  } else {
    // Don't split the markdown documents
    documents = resources.map(
      (resource) =>
        new Document({
          pageContent: resource.markdown,
          metadata: {
            ...resource,
            markdown: undefined,
            loc: undefined,
          },
        })
    );
  }

  const flattenedDocuments = documents.flat();
  const embeddings = await generateEmbeddings(
    flattenedDocuments.map((d) => d.pageContent),
    options.embedingModel
  );

  // ensure the ai directory exists in the users catalog
  await fs.ensureDir(path.join(process.env.PROJECT_DIR, 'public/ai'));

  // Write the file to embeddings.json
  // remove the old file if it exists
  if (fs.existsSync(path.join(process.env.PROJECT_DIR, 'public/ai/documents.json'))) {
    await fs.unlink(path.join(process.env.PROJECT_DIR, 'public/ai/documents.json'));
  }

  await fs.writeJSON(path.join(process.env.PROJECT_DIR, 'public/ai/documents.json'), flattenedDocuments);

  // Write the file to embeddings.json
  // remove the old file if it exists
  if (fs.existsSync(path.join(process.env.PROJECT_DIR, 'public/ai/embeddings.json'))) {
    await fs.unlink(path.join(process.env.PROJECT_DIR, 'public/ai/embeddings.json'));
  }
  await fs.writeJSON(path.join(process.env.PROJECT_DIR, 'public/ai/embeddings.json'), embeddings);

  // Add README.md to generated-ai folder
  const readmePath = path.join(process.env.PROJECT_DIR, 'public/ai/README.md');
  const readmeContent = `# Generated AI Content

This directory contains auto-generated files used by the @eventcatalog/ai plugin. These files are automatically created and updated when running the AI generator plugin.

## Files

- \`documents.json\`: Contains the processed documents and their metadata
- \`embeddings.json\`: Contains vector embeddings for the documents

> **Note:** This directory is automatically added to .gitignore as these files should not be committed to version control.
`;

  await fs.writeFile(readmePath, readmeContent);

  // Add ai folder to .gitignore if not already present
  const gitignorePath = path.join(process.env.PROJECT_DIR, '.gitignore');
  let gitignoreContent = '';

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
  }

  if (!gitignoreContent.includes('public/ai/')) {
    const aiEntry = gitignoreContent.endsWith('\n') ? 'public/ai/' : '\npublic/ai/';
    await fs.appendFile(gitignorePath, aiEntry);
    console.log(chalk.green(`Added public/ai/ directory to .gitignore`));
  }

  console.log(chalk.green(`  - Generated embeddings and documents. Saved to public/ai/`));
};
