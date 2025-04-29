import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
export default {
  cId: "10b46030-5736-4600-8254-421c3ed56e47",
  title: "EventCatalog",
  tagline: "Discover, Explore and Document your Event Driven Architectures",
  organizationName: "Your Company",
  homepageLink: "https://eventcatalog.dev/",
  editUrl: "https://github.com/boyney123/eventcatalog-demo/edit/master",
  // By default set to false, add true to get urls ending in /
  trailingSlash: false,
  // Change to make the base url of the site different, by default https://{website}.com/docs,
  // changing to /company would be https://{website}.com/company/docs,
  base: "/",
  // Customize the logo, add your logo to public/ folder
  logo: {
    alt: "EventCatalog Logo",
    src: "/logo.png",
    text: "EventCatalog",
  },
  chat: {
    enabled: true,
    similarityResults: 50,
    max_tokens: 4096,
    // pick your own OpenAI Model
    model: 'o4-mini',
  },
  // We have to output as a server, to keep API keys secret from the client
  // You will have to host this as a docker container or a server
  output: 'server',
  generators: [
    [
      '@eventcatalog/generator-confluent-schema-registry',
      {
        schemaRegistryUrl: 'http://localhost:8081',
        topics: [{
          id: 'orders-topic',
          name: 'Orders Topic',
          address: 'kafka-cluster-bootstrap:9092',
        }, {
          id: 'inventory-topic',
          name: 'Inventory Topic',
          address: 'kafka-cluster-bootstrap:9092',
        }, {
          id: 'users-topic',
          name: 'Users Topic',
          address: 'kafka-cluster-bootstrap:9092',
        }, {
          id: 'shipments-topic',
          name: 'Shipments Topic',
          address: 'kafka-cluster-bootstrap:9092',
        }],
        services: [
          {
            id: 'Orders Service',
            version: '1.0.0',
            sends: [{ events: { prefix: 'order-' }, topic: 'orders-topic' }],
            receives: [{ events: { prefix: 'analytics-' }, topic: 'inventory-topic' }],
          },
          {
            id: 'Inventory Service',
            version: '1.0.0',
            sends: [{ events: { prefix: 'inventory-' }, topic: 'inventory-topic' }],
            receives: [{ events: { prefix: 'order-' }, topic: 'orders-topic' }],
          },
          {
            id: 'Notifications Service',
            version: '1.0.0',
            receives: [
              { events: ['user-registered'], topic: 'users-topic' },
              { events: ['shipment-created'], topic: 'shipments-topic' },
              { events: ['payment-received'] }
            ],
          },
        ],
      },
    ],
    [
      // has to be the last generator to generate information for EventCatalog Chat
      "@eventcatalog/generator-ai", {
        debug: true,
        splitMarkdownFiles: false,
        includeUsersAndTeams: false,
        embedding: {
          // Set the provider to openai
          provider: 'openai',
          // Set the model to the OpenAI embeddings model
          // supports: text-embedding-3-large, text-embedding-3-small, text-embedding-ada-002
          model: 'text-embedding-3-large',
        },
      }
    ],

  ],
};
