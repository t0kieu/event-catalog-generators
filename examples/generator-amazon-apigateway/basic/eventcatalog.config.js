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
      "@eventcatalog/generator-amazon-apigateway",
      {
        output: 'amazon-api-gateway-output',
        apis: [
          {
            // The name of the API we want to process
            name: 'EcommerceApi',
            // Assume it's deployed to us-east-1, change this if you deployed somewhere else
            region: 'us-east-1',
            // The API stage name
            stageName: 'prod',
            version: '2',
            // Optional routes, we can map routes to message types
            // give them descriptions and unique ids in eventcatalog
            routes: {
              'post /cart/checkout': {
                type: 'command',
                id: 'CheckoutCart',
                description: 'Request to checkout the cart',
              },
              'post /cart/clear': {
                type: 'command',
                id: 'ClearCart',
                description: 'Request to clear the cart',
              },
            }
          }
        ]
      },
    ],
    // This will process the output of the amazon api gateway generator
    // it will process the OpenAPI file and map it into a service and domain
    // All routes are mapped to messages.
    [
      "@eventcatalog/generator-openapi",
      {
        services: [
          { path: path.join(__dirname, "amazon-api-gateway-output", "EcommerceApi.json"), id: 'ecommerce-api', owners: ['full-stack'] },
        ]
      },
    ],
  ],
};
