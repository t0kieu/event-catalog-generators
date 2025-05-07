# EventCatalog GitHub Plugin Example: Assign Schemas to Producers and Consumers

This example shows you how to pull and sync schemas from a GitHub schema registry (example used here: https://github.com/event-catalog/flowmart-schema-registry) and assign them to producers and consumers (services) in EventCatalog.

In this example we will pull schemas from GitHub and assign them to the orders and inventory services.

Any documentation we add to our messages and services are persisted between builds, so we can keep our documentation up to date. The schemas are synced with GitHub.

### Features of the GitHub Generator

- 📃 Pull and sync your schemas from your GitHub repository to EventCatalog
- 📃 Keep your schemas in sync with your producers and consumers documentation
- 📃 Supports any schema format (e.g Avro, Protobuf, JSON)
- 📃 Import all schemas, or specific folders/files
- ⭐ Go beyond a schema. Add semantic meaning to your schemas, business logic and much more. Help your developers and teams understand the meaning behind the schemas with clear documentation and visualisations.
- 📊 Visualise producers and consumers in your architecture (demo)
- ⭐ Download synced schemas from EventCatalog (e.g Avro, Protobuf, JSON) (demo)
- 📃 Assign schemas to events, commands and queries
- ⭐ Discoverability feature (search, filter and more) (demo)
- ⭐ And much more...

To dive into how this plugin can help you, you can read the [GitHub Plugin Docs](https://www.eventcatalog.dev/integrations/github)

## Prerequisites

- EventCatalog GitHub Plugin License Key (14 day free trial at [EventCatalog Cloud](https://eventcatalog.cloud))

### Running this example

Once you have this repository cloned, and setup you can run the example.

1. Run `npm install`
1. Get a EventCatalog license key for GitHub integration from [EventCatalog Cloud](https://eventcatalog.cloud) (14 day free trial)
1. Set the `EVENTCATALOG_LICENSE_KEY_GITHUB` environment variable in `.env` file.

```bash
EVENTCATALOG_LICENSE_KEY_GITHUB=your-license-key
```

4. Generate the catalog (you can see the configuration in `eventcatalog.config.js`)

```bash
npm run generate
```

5. Run the catalog locally

```bash
npm run dev
```

You can then view your catalog at http://localhost:3000

### Persist documentation between builds

The generator will persist the documentation between builds, so you can keep your documentation up to date.

Try and make a changes to the services or message documentation and rerun `npm run generate` to see the documentation persist.







