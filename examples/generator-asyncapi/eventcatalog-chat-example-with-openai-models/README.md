# EventCatalog AsyncAPI Example with EventCatalog Chat (OpenAI models)

This is an example project for EventCatalog with the AsyncAPI generator plugin.

This example contains

- Generating EventCatalog from AsyncAPI files
- Generate embeddings for your AsyncAPI files
- Chat with your AsyncAPI files using OpenAI models (you can choose from a list of models)

# Prerequisites

- Node.js 18+
- EventCatalog AsyncAPI license key (get 14 day free trial at https://eventcatalog.cloud)
- EventCatalog Starter Plan (get 14 day free trial at https://eventcatalog.cloud)

### Getting Started

1. Clone this project
1. Run `npm install`
1. Copy the `.env.example` file to `.env` and add your license keys (14 day free trial keys from [EventCatalog Cloud](https://eventcatalog.cloud))
1. Run the generators `npm run generate`
1. Run the catalog `npm run dev`
1. View your catalog at http://localhost:3000
1. Chat with your architecture (powered by your AsyncAPI files) at http://localhost:3000/chat

### Features for AsyncAPI Plugin

- Auto versioning of domains, services and messages
- Document events, queries and commands using custom extensions to AsyncAPI
- Assign each route/message a version independent of your AsyncAPI version
- Visually see AsyncAPI files in your catalog.
- And much more...

To dive into how this plugin can help you, you can read the [AsyncAPI Plugin Docs](https://www.eventcatalog.dev/integrations/asyncapi)

