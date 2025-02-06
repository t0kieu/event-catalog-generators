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
  docs: {
    sidebar: {
      // Should the sub heading be rendered in the docs sidebar?
      showPageHeadings: true,
    },
  },
  generators: [
    [
      '@eventcatalog/generator-eventbridge',
      {
        region: 'us-east-1',
        // Name of the registry in EventBridge, if you are using EventBridge Schema discovery this should be discovered-schemas
        registryName: 'discovered-schemas',
        services: [
          // Here we say the order service sends any events that match the source (demo.orders)
          // This service consumes an event from the inventory service called InventoryUpdated
          { id: 'Orders Service', version: '1.0.0', sends: [{ source: ['demo.orders'], eventBusName: 'my-demo-bus'}], receives:[{ detailType: ['InventoryUpdated'], eventBusName: 'my-demo-bus'}] },
        ],
        // This service is mapped into the orders domain
        domain: { id: 'orders', name: 'Orders', version: '0.0.1' },
      },
    ],
    [
      '@eventcatalog/generator-eventbridge',
      {
        region: 'us-east-1',
        // Name of the registry in EventBridge, if you are using EventBridge Schema discovery this should be discovered-schemas
        registryName: 'discovered-schemas',
        services: [
          // Here we say the payments service sends any events that match the source (demo.payments)
          // This service consumes an event from the orders service called OrderCreated
          { id: 'Payments Service', version: '1.0.0', sends: [{ source: ['demo.payments'], eventBusName: 'my-demo-bus'}, {detailType: ['EmailSent'], eventBusName: 'my-demo-bus'}], receives:[{ detailType: ['OrderCreated'], eventBusName: 'my-demo-bus'}] },
        ],
        // This service is mapped into the payments domain
        domain: { id: 'payments', name: 'Payments', version: '0.0.1' },
      },
    ],
    [
      '@eventcatalog/generator-eventbridge',
      {
        region: 'us-east-1',
        // Name of the registry in EventBridge, if you are using EventBridge Schema discovery this should be discovered-schemas
        registryName: 'discovered-schemas',
        services: [
          // Here we say the payments service sends any events that match the source (demo.payments)
          // This service consumes an event from the orders service called OrderCreated
          { id: 'Notifications Service', version: '1.0.0', sends: [{ source: ['demo.communications'], eventBusName: 'my-demo-bus'}]},
        ],
        // This service is mapped into the payments domain
        domain: { id: 'notifications', name: 'Notifications', version: '0.0.1' },
      },
    ]
  ],
};
