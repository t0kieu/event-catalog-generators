import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import utils from '@eventcatalog/sdk';
import plugin from '../index';
import { join } from 'node:path';
import fs from 'fs/promises';
import { vi } from 'vitest';
import { existsSync } from 'node:fs';

// Add mock for the local checkLicense module
vi.mock('../../../../shared/checkLicense', () => ({
  default: () => Promise.resolve(),
}));

// Fake eventcatalog config
const config = {};

let catalogDir: string;
const graphQLExamples = join(__dirname, 'graphql-files');

describe('GraphQL EventCatalog Plugin', () => {
  beforeEach(async () => {
    catalogDir = join(__dirname, 'catalog') || '';
    const exists = await fs
      .access(catalogDir)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      await fs.rm(catalogDir, { recursive: true });
    }
    await fs.mkdir(catalogDir, { recursive: true });
    process.env.PROJECT_DIR = catalogDir;
  });

  afterEach(async () => {
    // await fs.rm(join(catalogDir), { recursive: true });
  });

  describe('service generation', () => {
    describe('domains', () => {
      it.only('if a domain is defined in the GraphQL plugin configuration and that domain does not exist, it is created', async () => {
        const { getDomain } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
          domain: { id: 'users', name: 'Users Domain', version: '1.0.0' },
        });

        const domain = await getDomain('users', '1.0.0');

        expect(domain).toEqual(
          expect.objectContaining({
            id: 'users',
            name: 'Users Domain',
            version: '1.0.0',
            services: [{ id: 'user-service', version: '1.0.0' }],
          })
        );
      });

      it('if a domain is not defined in the GraphQL plugin configuration, the service is not added to any domains', async () => {
        const { getDomain } = utils(catalogDir);
        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
        });
        expect(await getDomain('users', '1.0.0')).toBeUndefined();
      });

      it('if a domain is defined in the GraphQL file but the versions do not match, the existing domain is versioned and a new one is created', async () => {
        const { writeDomain, getDomain } = utils(catalogDir);

        await writeDomain({
          id: 'users',
          name: 'Users Domain',
          version: '0.0.1',
          markdown: '',
        });

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
          domain: { id: 'users', name: 'Users Domain', version: '1.0.0' },
        });

        const versionedDomain = await getDomain('users', '0.0.1');
        const newDomain = await getDomain('users', '1.0.0');

        expect(versionedDomain.version).toEqual('0.0.1');
        expect(newDomain.version).toEqual('1.0.0');
        expect(newDomain.services).toEqual([{ id: 'user-service', version: '1.0.0' }]);
      });

      it('if a domain is defined in the GraphQL plugin configuration and that domain exists the GraphQL Service is added to that domain', async () => {
        const { writeDomain, getDomain } = utils(catalogDir);

        await writeDomain({
          id: 'users',
          name: 'Users Domain',
          version: '1.0.0',
          markdown: '',
        });

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
          domain: { id: 'users', name: 'Users Domain', version: '1.0.0' },
        });

        const domain = await getDomain('users', '1.0.0');
        expect(domain.services).toEqual([{ id: 'user-service', version: '1.0.0' }]);
      });

      it('if multiple GraphQL files are processed, they are all added to the domain', async () => {
        const { getDomain } = utils(catalogDir);

        await plugin(config, {
          services: [
            { path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' },
            { path: join(graphQLExamples, 'petstore.graphql'), id: 'petstore-service' },
          ],
          domain: { id: 'api', name: 'API Domain', version: '1.0.0' },
        });

        const domain = await getDomain('api', 'latest');

        expect(domain.services).toHaveLength(2);
        expect(domain.services).toEqual([
          { id: 'user-service', version: '1.0.0' },
          { id: 'petstore-service', version: '1.0.0' },
        ]);
      });
    });

    describe('services', () => {
      it('takes a given GraphQL schema file and creates a service in EventCatalog for it', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
        });

        const service = await getService('user-service');

        expect(service).toEqual(
          expect.objectContaining({
            id: 'user-service',
            name: 'user-service',
            version: '1.0.0',
          })
        );
      });

      it('if a GraphQL service already exists in EventCatalog, it will be versioned before the new one is created', async () => {
        const { writeService, getService } = utils(catalogDir);

        await writeService({
          id: 'user-service',
          name: 'User Service',
          version: '1.0.0',
          markdown: 'Original service',
        });

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
        });

        const latestService = await getService('user-service');
        const versionedService = await getService('user-service', '1.0.0');

        expect(latestService.id).toEqual('user-service');
        expect(latestService.markdown).toContain('This service was generated from a GraphQL schema');
        expect(versionedService.markdown).toEqual('Original service');
      });
    });

    describe('messages', () => {
      it('takes a GraphQL schema with queries and creates query messages in EventCatalog', async () => {
        const { getMessage } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
        });

        const getUserMessage = await getMessage('getUser');
        const getUsersMessage = await getMessage('getUsers');

        expect(getUserMessage).toEqual(
          expect.objectContaining({
            id: 'getUser',
            name: 'getUser',
            version: '1.0.0',
            type: 'query',
            producers: [{ id: 'user-service', version: '1.0.0' }],
          })
        );

        expect(getUsersMessage).toEqual(
          expect.objectContaining({
            id: 'getUsers',
            name: 'getUsers',
            version: '1.0.0',
            type: 'query',
            producers: [{ id: 'user-service', version: '1.0.0' }],
          })
        );
      });

      it('takes a GraphQL schema with mutations and creates command messages in EventCatalog', async () => {
        const { getMessage } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'petstore.graphql'), id: 'petstore-service' }],
        });

        const addPetMessage = await getMessage('addPet');
        const updatePetMessage = await getMessage('updatePet');
        const deletePetMessage = await getMessage('deletePet');

        expect(addPetMessage).toEqual(
          expect.objectContaining({
            id: 'addPet',
            name: 'addPet',
            version: '1.0.0',
            type: 'command',
            producers: [{ id: 'petstore-service', version: '1.0.0' }],
          })
        );

        expect(updatePetMessage.type).toEqual('command');
        expect(deletePetMessage.type).toEqual('command');
      });

      it('takes a GraphQL schema with subscriptions and creates event messages in EventCatalog', async () => {
        const { getMessage } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'petstore.graphql'), id: 'petstore-service' }],
        });

        const petStatusUpdatedMessage = await getMessage('petStatusUpdated');
        const petAddedMessage = await getMessage('petAdded');

        expect(petStatusUpdatedMessage).toEqual(
          expect.objectContaining({
            id: 'petStatusUpdated',
            name: 'petStatusUpdated',
            version: '1.0.0',
            type: 'event',
            producers: [{ id: 'petstore-service', version: '1.0.0' }],
          })
        );

        expect(petAddedMessage.type).toEqual('event');
      });

      it('generates markdown content for messages with operation details', async () => {
        const { getMessage } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
        });

        const getUserMessage = await getMessage('getUser');

        expect(getUserMessage.markdown).toContain('# getUser');
        expect(getUserMessage.markdown).toContain('## Operation Details');
        expect(getUserMessage.markdown).toContain('- **Type**: query');
        expect(getUserMessage.markdown).toContain('- **Return Type**: User');
        expect(getUserMessage.markdown).toContain('## Arguments');
        expect(getUserMessage.markdown).toContain('| id | ID! |');
      });
    });

    describe('custom generators', () => {
      it('allows users to provide their own markdown generators for services', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          services: [
            {
              path: join(graphQLExamples, 'simple.graphql'),
              id: 'user-service',
              generateMarkdown: () => '# Custom Service Markdown',
            },
          ],
        });

        const service = await getService('user-service');
        expect(service.markdown).toEqual('# Custom Service Markdown');
      });

      it('allows users to provide their own markdown generators for messages', async () => {
        const { getMessage } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
          messages: {
            generateMarkdown: () => '# Custom Message Markdown',
          },
        });

        const getUserMessage = await getMessage('getUser');
        expect(getUserMessage.markdown).toEqual('# Custom Message Markdown');
      });
    });

    describe('schema file saving', () => {
      it('saves the GraphQL schema file when saveParsedSpecFile is true', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          services: [{ path: join(graphQLExamples, 'simple.graphql'), id: 'user-service' }],
          saveParsedSpecFile: true,
        });

        const service = await getService('user-service');
        expect(service.schemaFile).toBeDefined();
        expect(service.schemaFile?.fileName).toEqual('schema.graphql');
        expect(service.schemaFile?.content).toContain('type Query');
        expect(service.schemaFile?.content).toContain('type User');
      });
    });
  });
});