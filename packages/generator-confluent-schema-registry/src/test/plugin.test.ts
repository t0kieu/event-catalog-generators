import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import utils from '@eventcatalog/sdk';
import plugin from '../index';
import path, { join } from 'node:path';
import fs from 'fs/promises';
import { existsSync } from 'node:fs';
import schemasMock from './mock-data/schemas.json';
// Add mock for the local checkLicense module
vi.mock('../checkLicense', () => ({
  default: () => Promise.resolve(),
}));

// Fake eventcatalog config
const config = {
  title: 'My EventCatalog',
};

let catalogDir: string;

// mock out axios get request
vi.mock('axios', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.endsWith('/schemas')) {
        return Promise.resolve({ data: schemasMock });
      }
      if (url.endsWith('/versions/latest')) {
        const subject = url.split('/')[4];
        const version = subject.includes('analytics-event-view-value') ? 5 : 1;
        return Promise.resolve({
          data: {
            subject: subject,
            version: version,
            id: 20,
            schemaType: 'PROTOBUF',
            schema: `syntax = "proto3";\npackage com.example;\n\nmessage ${subject} {\n  string id = 1;\n  string name = 2;\n}\n`,
          },
        });
      }
      // Add other endpoints if needed, or return a default mock response
      return Promise.resolve({ data: {} });
    }),
  },
}));

describe('Confluent Schema Registry EventCatalog Plugin', () => {
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

  it('when no url is provided, it throws an error', async () => {
    // @ts-ignore
    await expect(plugin(config, {})).rejects.toThrow('Please provide a url for the Confluent Schema Registry');
  });

  describe('when no services are configured (topics are written to the root of the catalog)', () => {
    it('if the topic already exists in the catalog data is persisted (e.g markdown, badges, summary, channels, deprecated)', async () => {
      const { writeEvent, getEvent } = utils(catalogDir);

      await writeEvent({
        id: 'analytics-event-view',
        name: 'analytics-event-view',
        version: '5',
        markdown: 'This should be persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
        channels: [{ id: 'analytics-event-view', version: '5' }],
      });

      await plugin(config, {
        url: 'http://localhost:8081',
      });

      const event = await getEvent('analytics-event-view', '5');
      expect(event.markdown).toEqual('This should be persisted');
      expect(event.badges).toEqual([{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }]);
      expect(event.summary).toEqual('This is custom summary');
      expect(event.channels).toEqual([{ id: 'analytics-event-view', version: '5' }]);
    });

    it('if the topic already exists in the catalog and the versions are the same, but the schema is different, the schema is updated', async () => {
      const { writeEvent, addSchemaToEvent } = utils(catalogDir);

      await writeEvent({
        id: 'analytics-event-view',
        name: 'analytics-event-view',
        version: '5',
        markdown: 'This should be persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
      });

      // Update the schema
      await addSchemaToEvent('analytics-event-view', {
        fileName: 'analytics-event-view-value.proto',
        schema: 'This is a new schema',
      });

      await plugin(config, {
        url: 'http://localhost:8081',
      });

      // Check the schema is updated
      const schema = await fs.readFile(
        join(catalogDir, 'events', 'analytics-event-view', 'analytics-event-view-value.proto'),
        'utf8'
      );
      expect(schema).not.toEqual('This is a new schema');
      expect(schema).toEqual(`syntax = "proto3";
package com.example;

message analytics_event_view_value {
  string id = 1;
  string name = 2;
  int64 timestamp = 3;
  bool active = 4;
}
`);

      await plugin(config, {
        url: 'http://localhost:8081',
      });
    });

    it('if the topic does not exist in the catalog, default values are given for the badges, summary and markdown', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        includeAllVersions: false,
      });

      const event = await getEvent('analytics-event-view');
      expect(event.markdown).toEqual(expect.stringContaining('<NodeGraph />'));
      expect(event.badges).toEqual([{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Topic' }]);
      expect(event.summary).toEqual('Kafka Topic from Confluent Schema Registry');
    });

    it('all topics are added to the catalog (within the events directory)', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
      });

      const event = await getEvent('analytics-event-view');
      expect(event).toEqual(expect.objectContaining({ id: 'analytics-event-view', version: '5' }));

      const eventsFolder = await existsSync(join(catalogDir, 'events', 'analytics-event-view', 'index.mdx'));
      expect(eventsFolder).toBeTruthy();
    });

    it('when includeAllVersions is false, only the latest version of the topic is added to the catalog (within the events directory)', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        includeAllVersions: false,
      });

      const event = await getEvent('analytics-event-view');
      expect(event).toEqual(
        expect.objectContaining({
          id: 'analytics-event-view',
          name: 'analytics-event-view',
          version: '5',
          markdown: expect.stringContaining('<NodeGraph />'),
          schemaPath: 'analytics-event-view-value.proto',
          badges: [{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Topic' }],
        })
      );

      const schemaFile = await fs.readFile(
        join(catalogDir, 'events', 'analytics-event-view', 'analytics-event-view-value.proto')
      );
      expect(schemaFile).toBeDefined();

      // Check if folder exists
      const versionedFolder = await existsSync(join(catalogDir, 'events', 'analytics-event-view', 'versioned'));
      expect(versionedFolder).toBeFalsy();
    });

    it('writes all versions of the topic to catalog when includeAllVersions is true', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        includeAllVersions: true,
      });

      const event = await getEvent('analytics-event-view', '5');
      expect(event).toEqual(expect.objectContaining({ id: 'analytics-event-view', version: '5' }));

      const versionedFolder = await existsSync(join(catalogDir, 'events', 'analytics-event-view', 'versioned'));
      expect(versionedFolder).toBeTruthy();

      for (let i = 1; i <= 4; i++) {
        const versionedFolder = await existsSync(join(catalogDir, 'events', 'analytics-event-view', 'versioned', i.toString()));
        expect(versionedFolder).toBeTruthy();
      }
    });
  });

  describe('services', () => {
    it('when a service is configured, the service is added to the catalog with the configured topics as publishers and subscribers', async () => {
      const { getService } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const service = await getService('Orders Service', '1.0.0');
      expect(service).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '1.0.0',
          sends: [{ id: 'analytics-event-view', version: '5' }],
          receives: [{ id: 'customer-deleted', version: '1' }],
        })
      );
    });

    it('when multiple services are configured, the services are added to the catalog with the configured topics as publishers and subscribers', async () => {
      const { getService } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
          {
            id: 'Customers Service',
            version: '1.0.0',
            sends: [{ topic: 'order-created' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const ordersService = await getService('Orders Service', '1.0.0');
      expect(ordersService).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '1.0.0',
          sends: [{ id: 'analytics-event-view', version: '5' }],
          receives: [{ id: 'customer-deleted', version: '1' }],
        })
      );

      const customersService = await getService('Customers Service', '1.0.0');
      expect(customersService).toEqual(
        expect.objectContaining({
          id: 'Customers Service',
          version: '1.0.0',
          sends: [{ id: 'order-created', version: '1' }],
          receives: [{ id: 'customer-deleted', version: '1' }],
        })
      );

      // Verify that the events are added to the service folder
      const eventsFolder = await existsSync(join(catalogDir, 'services', 'Orders Service', 'events'));
      expect(eventsFolder).toBeTruthy();

      // const orderCreatedFile = await existsSync(join(catalogDir, 'services', 'Orders Service', 'events', 'order-created', 'index.mdx'));
      // expect(orderCreatedFile).toBeTruthy();
    });

    it('when the given topics are an array, the service is added to the catalog with the configured topics as publishers and subscribers', async () => {
      const { getService } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: ['analytics-event-view', 'customer-deleted'] }],
            receives: [{ topic: ['customer-deleted'] }],
          },
        ],
      });

      const service = await getService('Orders Service', '1.0.0');
      expect(service).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '1.0.0',
          sends: [
            { id: 'analytics-event-view', version: '5' },
            { id: 'customer-deleted', version: '1' },
          ],
          receives: [{ id: 'customer-deleted', version: '1' }],
        })
      );
    });

    it('when the service already exists in the catalog, the service information is persisted (e.g markdown, badges, summary) but the sends and receives are updated', async () => {
      const { writeService, getService } = utils(catalogDir);

      await writeService({
        id: 'Orders Service',
        version: '1.0.0',
        name: 'Orders Service',
        markdown: 'This markdown is persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
        sends: [{ id: 'this-topic-is-removed', version: '1' }],
        receives: [{ id: 'this-topic-is-removed', version: '1' }],
        owners: ['John Doe', 'Jane Doe'],
      });

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: ['analytics-event-view', 'customer-deleted'] }],
            receives: [{ topic: ['customer-deleted'] }],
          },
        ],
      });

      const service = await getService('Orders Service', '1.0.0');
      expect(service).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '1.0.0',
          markdown: 'This markdown is persisted',
          badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
          summary: 'This is custom summary',
          sends: [
            { id: 'analytics-event-view', version: '5' },
            { id: 'customer-deleted', version: '1' },
          ],
          receives: [{ id: 'customer-deleted', version: '1' }],
          owners: ['John Doe', 'Jane Doe'],
        })
      );
    });

    it('when the service already exists in the catalog, but the versions are different, the service in the catalog is versioned', async () => {
      const { writeService, getService } = utils(catalogDir);

      await writeService({
        id: 'Orders Service',
        version: '1.0.0',
        name: 'Orders Service',
        markdown: 'This markdown is persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
        sends: [{ id: 'this-topic-is-saved-on-version-1', version: '1' }],
        receives: [{ id: 'this-topic-is-saved-on-version-1', version: '1' }],
      });

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '2.0.0',
            sends: [{ topic: ['analytics-event-view', 'customer-deleted'] }],
            receives: [{ topic: ['customer-deleted'] }],
          },
        ],
      });

      const oldService = await getService('Orders Service', '1.0.0');
      expect(oldService).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '1.0.0',
          markdown: 'This markdown is persisted',
          badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
          summary: 'This is custom summary',
          sends: [{ id: 'this-topic-is-saved-on-version-1', version: '1' }],
          receives: [{ id: 'this-topic-is-saved-on-version-1', version: '1' }],
        })
      );

      const newService = await getService('Orders Service', '2.0.0');
      expect(newService).toEqual(
        expect.objectContaining({
          id: 'Orders Service',
          version: '2.0.0',
        })
      );

      // Make sure versioned folder exists
      const versionedFolder = await existsSync(join(catalogDir, 'services', 'Orders Service', 'versioned'));
      expect(versionedFolder).toBeTruthy();
    });

    describe('publishers and subscribers with filters', () => {
      it('when a prefix filter is in the service config, the topics that match the prefix are added to the service', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          url: 'http://localhost:8081',
          services: [{ id: 'Orders Service', version: '1.0.0', sends: [{ prefix: 'analytics-' }] }],
        });

        const service = await getService('Orders Service', '1.0.0');
        expect(service).toEqual(
          expect.objectContaining({
            id: 'Orders Service',
            version: '1.0.0',
            sends: [
              { id: 'analytics-event-click', version: '1' },
              { id: 'analytics-event-convert', version: '1' },
              { id: 'analytics-event-view', version: '5' },
            ],
          })
        );
      });

      it('when a suffix filter is in the service config, the topics that match the suffix are added to the service', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          url: 'http://localhost:8081',
          services: [{ id: 'Orders Service', version: '1.0.0', receives: [{ suffix: '-click' }] }],
        });

        const service = await getService('Orders Service', '1.0.0');
        expect(service.receives).toEqual([{ id: 'analytics-event-click', version: '1' }]);
      });

      it('when a `includes` filter is in the service config, the schemas that match the include filter are added to the service', async () => {
        const { getService } = utils(catalogDir);

        await plugin(config, {
          url: 'http://localhost:8081',
          services: [{ id: 'Orders Service', version: '1.0.0', receives: [{ includes: '-event-' }] }],
        });

        const service = await getService('Orders Service', '1.0.0');
        expect(service.receives).toEqual([
          { id: 'analytics-event-click', version: '1' },
          { id: 'analytics-event-convert', version: '1' },
          { id: 'analytics-event-view', version: '5' },
        ]);
      });
    });
  });

  describe('events', () => {
    it('when the service has sends and receives configured, the topics (events) are added to the catalog (within the service directory)', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const analyticsEventView = await getEvent('analytics-event-view');
      expect(analyticsEventView).toEqual(
        expect.objectContaining({
          id: 'analytics-event-view',
          version: '5',
          markdown: expect.stringContaining('<NodeGraph />'),
          badges: [{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Topic' }],
          summary: 'Kafka Topic from Confluent Schema Registry',
        })
      );

      const customerDeleted = await getEvent('customer-deleted');
      expect(customerDeleted).toEqual(
        expect.objectContaining({
          id: 'customer-deleted',
          version: '1',
          markdown: expect.stringContaining('<NodeGraph />'),
          badges: [{ backgroundColor: 'green', textColor: 'white', content: 'Kafka Topic' }],
          summary: 'Kafka Topic from Confluent Schema Registry',
        })
      );

      // Make sure the events are added to the service folder
      const eventsFolder = await existsSync(join(catalogDir, 'services', 'Orders Service', 'events'));
      expect(eventsFolder).toBeTruthy();

      const analyticsEventViewFile = await existsSync(
        join(catalogDir, 'services', 'Orders Service', 'events', 'analytics-event-view', 'index.mdx')
      );
      expect(analyticsEventViewFile).toBeTruthy();

      const customerDeletedFile = await existsSync(
        join(catalogDir, 'services', 'Orders Service', 'events', 'customer-deleted', 'index.mdx')
      );
      expect(customerDeletedFile).toBeTruthy();
    });

    it('when the service has sends and receives configured, but the topics are not found in the schema registry, the topics are not added to the catalog', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view-that-does-not-exist' }],
            receives: [{ topic: 'customer-deleted-that-does-not-exist' }],
          },
        ],
      });

      const analyticsEventView = await getEvent('analytics-event-view-that-does-not-exist');
      expect(analyticsEventView).toBeUndefined();

      const customerDeleted = await getEvent('customer-deleted-that-does-not-exist');
      expect(customerDeleted).toBeUndefined();
    });

    it('when the service has sends and receives configured, but the topics already exist in the catalog (with the same version), the topic information is persisted', async () => {
      const { writeEvent, getEvent } = utils(catalogDir);

      await writeEvent({
        id: 'analytics-event-view',
        version: '5',
        markdown: 'This markdown is persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
        name: 'analytics-event-view',
      });

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const analyticsEventView = await getEvent('analytics-event-view');
      expect(analyticsEventView).toEqual(
        expect.objectContaining({
          id: 'analytics-event-view',
          version: '5',
          markdown: 'This markdown is persisted',
          badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
          summary: 'This is custom summary',
        })
      );
    });

    it('when the service has sends and receives configured, but the versions are different, the topic is versioned', async () => {
      const { getEvent, writeEventToService, writeService, addSchemaToEvent } = utils(catalogDir);

      // Add the service to the catalog
      await writeService({
        id: 'Orders Service',
        version: '1.0.0',
        name: 'Orders Service',
        markdown: 'This markdown is persisted',
        badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
        summary: 'This is custom summary',
      });

      await writeEventToService(
        {
          id: 'analytics-event-view',
          version: '4',
          markdown: 'This markdown is persisted',
          badges: [{ backgroundColor: 'red', textColor: 'white', content: 'Custom Badge' }],
          summary: 'This is custom summary',
          name: 'analytics-event-view',
        },
        { id: 'Orders Service' }
      );

      // Add schema to the event
      await addSchemaToEvent('analytics-event-view', {
        fileName: 'analytics-event-view-value.proto',
        schema: 'This is a schema',
      });

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const analyticsEventView = await getEvent('analytics-event-view');
      expect(analyticsEventView).toEqual(
        expect.objectContaining({
          id: 'analytics-event-view',
          version: '5',
        })
      );

      const versionedFolder = await existsSync(
        join(catalogDir, 'services', 'Orders Service', 'events', 'analytics-event-view', 'versioned')
      );
      expect(versionedFolder).toBeTruthy();

      const versionedEvent = await existsSync(
        join(catalogDir, 'services', 'Orders Service', 'events', 'analytics-event-view', 'versioned', '4', 'index.mdx')
      );
      const versionedSchema = await existsSync(
        join(
          catalogDir,
          'services',
          'Orders Service',
          'events',
          'analytics-event-view',
          'versioned',
          '4',
          'analytics-event-view-value.proto'
        )
      );
      expect(versionedEvent).toBeTruthy();
      expect(versionedSchema).toBeTruthy();
    });

    it('when the service has sends and receives configured, only these topics are added to the catalog', async () => {
      const { getEvent } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
      });

      const analyticsEventView = await getEvent('analytics-event-view');
      expect(analyticsEventView).toBeTruthy();

      const customerDeleted = await getEvent('customer-deleted');
      expect(customerDeleted).toBeTruthy();

      // Make sure only two events are added to the folder
      const eventsFolder = await existsSync(join(catalogDir, 'services', 'Orders Service', 'events'));
      expect(eventsFolder).toBeTruthy();

      const events = await fs.readdir(join(catalogDir, 'services', 'Orders Service', 'events'));
      expect(events.length).toBe(2);

      // This is in the schema registry "order-created-value" but make sure it is not added to the catalog
      const orderCreated = await getEvent('order-created-value');
      expect(orderCreated).toBeUndefined();
    });
  });

  describe('domains', () => {
    it('if a domain is configured along side the services, the domain is created and the services are added to the domain, and events added to the services folder', async () => {
      const { getDomain } = utils(catalogDir);

      await plugin(config, {
        url: 'http://localhost:8081',
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ topic: 'analytics-event-view' }],
            receives: [{ topic: 'customer-deleted' }],
          },
        ],
        domain: { id: 'orders', name: 'Orders', version: '0.0.1' },
      });

      const domain = await getDomain('orders', '0.0.1');
      expect(domain).toEqual(
        expect.objectContaining({
          id: 'orders',
          name: 'Orders',
          version: '0.0.1',
          services: [{ id: 'Orders Service', version: '1.0.0' }],
        })
      );

      // Verify the folder structure
      const servicesFolder = await existsSync(join(catalogDir, 'domains', 'orders', 'services'));
      expect(servicesFolder).toBeTruthy();

      const ordersService = await existsSync(join(catalogDir, 'domains', 'orders', 'services', 'Orders Service'));
      expect(ordersService).toBeTruthy();

      // Verify the events are added to the service folder
      const eventsFolder = await existsSync(join(catalogDir, 'domains', 'orders', 'services', 'Orders Service', 'events'));
      expect(eventsFolder).toBeTruthy();

      const events = await fs.readdir(join(catalogDir, 'domains', 'orders', 'services', 'Orders Service', 'events'));
      expect(events.length).toBe(2);
    });

    it('if the given domain already exists in the catalog, but the versions are different, the domain is versioned', async () => {
      const { getDomain, writeDomain } = utils(catalogDir);

      await writeDomain({
        id: 'orders',
        name: 'Orders',
        version: '0.0.1',
        markdown: 'Old domain markdown',
      });

      await plugin(config, {
        url: 'http://localhost:8081',
        domain: { id: 'orders', name: 'Orders', version: '0.0.2' },
      });

      const domain = await getDomain('orders', '0.0.2');
      expect(domain).toEqual(
        expect.objectContaining({
          id: 'orders',
          name: 'Orders',
          version: '0.0.2',
        })
      );

      // Verify the domain is versioned
      const versionedFolder = await existsSync(join(catalogDir, 'domains', 'orders', 'versioned'));
      expect(versionedFolder).toBeTruthy();

      const versionedDomain = await existsSync(join(catalogDir, 'domains', 'orders', 'versioned', '0.0.1'));
      expect(versionedDomain).toBeTruthy();
    });
  });
});