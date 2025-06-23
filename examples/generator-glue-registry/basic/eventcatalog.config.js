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
      '@eventcatalog/generator-aws-glue',
      {
        region: 'us-east-1',
        registryName: 'eventcatalog-test-registry',
        domain: {
          id: 'ecommerce',
          name: 'E-commerce Platform',
          version: '1.0.0'
        },
        services: [
          {
            id: 'Customer Service',
            version: '1.0.0',
            sends: [
              { prefix: 'Customer' },
              { suffix: 'ProfileUpdated' }
            ],
            receives: [
              { schemaName: 'OrderShipped' }
            ]
          },
          {
            id: 'Order Service',
            version: '1.0.0',
            sends: [
              // Everything that starts with Order
              { prefix: 'Order' },
              // exact matching on the schema name
              { schemaName: ['InventoryReserved', 'PaymentRequested'] }
            ],
            receives: [
              // Everything that starts with Customer
              { prefix: 'Customer' }
            ]
          },
          {
            id: 'Inventory Service',
            version: '1.0.0',
            sends: [
              { prefix: 'Inventory' },
              { includes: 'stock' }
            ],
            receives: [
              { schemaName: 'OrderPlaced' },
              { includes: 'reservation' }
            ]
          }
        ]
      },
    ],
  ],
};
