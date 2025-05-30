import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
export default {
  cId: 'f8597068-04ce-4cbc-97d4-ceb18b709fd1',
  title: 'OurLogix',
  tagline: 'A comprehensive logistics and shipping management company',
  organizationName: 'OurLogix',
  homepageLink: 'https://eventcatalog.dev/',
  landingPage: '',
  editUrl: 'https://github.com/boyney123/eventcatalog-demo/edit/master',
  // By default set to false, add true to get urls ending in /
  trailingSlash: false,
  // Change to make the base url of the site different, by default https://{website}.com/docs,
  // changing to /company would be https://{website}.com/company/docs,
  base: '/',
  // Customize the logo, add your logo to public/ folder
  logo: {
    alt: 'EventCatalog Logo',
    src: '/logo.png',
    text: 'OurLogix',
  },
  docs: {
    sidebar: {
      // Should the sub heading be rendered in the docs sidebar?
      showPageHeadings: true,
    },
  },
  generators: [
    [
      '@eventcatalog/generator-asyncapi',
      {
        services: [
          { path: path.join(__dirname, 'asyncapi-files', 'orders-service.yml'), id: 'Orders Service' },
          { path: path.join(__dirname, 'asyncapi-files', 'order-fulfillment-service.yml'), id: 'Order Fulfillment' },
          { path: path.join(__dirname, 'asyncapi-files', 'inventory-service.yml'), id: 'Inventory Service' },
        ],
        domain: { id: 'orders', name: 'Orders', version: '0.0.1' },
      },
    ],
    [
      '@eventcatalog/generator-asyncapi',
      {
        services: [
          { path: path.join(__dirname, 'asyncapi-files', 'payment-service.yml'), id: 'Payment Service' },
          { path: path.join(__dirname, 'asyncapi-files', 'fraud-detection-service.yml'), id: 'Fraud Detection' },
        ],
        domain: { id: 'payment', name: 'Payment', version: '0.0.1' },
      },
    ],
    [
      '@eventcatalog/generator-asyncapi',
      {
        services: [
          { path: path.join(__dirname, 'asyncapi-files', 'user-service.yml'), id: 'User Service' },
        ],
        domain: { id: 'user-domain', name: 'User Domain', version: '0.0.1' },
        debug: true
      },
    ],
    [
      "@eventcatalog/generator-ai", {
        debug: true,
        splitMarkdownFiles: false,
        includeUsersAndTeams: false
      }
    ],
  ],
  output: 'server',
  chat: {
    enabled: true,
    similarityResults: 50,
    max_tokens: 4096,
    model: 'o4-mini'
  },
};
