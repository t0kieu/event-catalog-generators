<div align="center">

<h1>⚡️ Confluent Schema Registry generator for EventCatalog</h1>

[![PRs Welcome][prs-badge]][prs]
<img src="https://img.shields.io/github/actions/workflow/status/event-catalog/generator-asyncapi/verify-build.yml"/>
[![](https://dcbadge.limes.pink/api/server/https://discord.gg/3rjaZMmrAm?style=flat)](https://discord.gg/3rjaZMmrAm) [<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" height="20px" />](https://www.linkedin.com/in/david-boyne/) [![blog](https://img.shields.io/badge/blog-EDA--Visuals-brightgreen)](https://eda-visuals.boyney.io/?utm_source=event-catalog-gihub) [![blog](https://img.shields.io/badge/license-Dual--License-brightgreen)](https://github.com/event-catalog/generator-asyncapi/blob/main/LICENSE.md)

<img alt="header" src="https://github.com/event-catalog/generators/blob/main/images/confluent.png?raw=true" />

<h4>Features: Generate EventCatalog from your Confluent Schema Registry. Assign topics to services and domains. Sync with registry and more... </h4>

[Read the Docs](https://eventcatalog.dev/) | [Edit the Docs](https://github.com/event-catalog/docs) | [View Demo](https://demo.eventcatalog.dev/docs)

</div>

<hr/>

# Core Features

- 📃 Document domains, services and messages from your Confluent Schema Registry ([example](https://github.com/event-catalog/generators/tree/main/examples/generator-confluent-schema-registry))
- 📊 Visualise your architecture ([demo](https://demo.eventcatalog.dev/visualiser))
- ⭐ Download your message schemas from EventCatalog (e.g Avro, Protobuf, JSON) ([demo](https://demo.eventcatalog.dev/docs/events/InventoryAdjusted/0.0.4))
- 💅 Custom MDX components ([read more](https://eventcatalog.dev/docs/development/components/using-components))
- 🗄️ Auto versioning of your domains, services and messages, in sync with your registry versions
- ⭐ [Document your channels and protocols](https://www.eventcatalog.dev/docs/development/plugins/async-api/features#mapping-channels-into-eventcatalog)
- ⭐ [Document queries, commands and events with your AsyncAPI file using EventCatalog extensions](https://www.eventcatalog.dev/docs/development/plugins/async-api/features#mapping-messages-events-commands-or-queries)
- ⭐ Discoverability feature (search, filter and more) ([demo](https://demo.eventcatalog.dev/discover/events))
- ⭐ And much more...

# How it works

[EventCatalog](https://www.eventcatalog.dev/) is technology agnostic, meaning it can integrate with any schemas, specs or brokers.

EventCatalog supports [generators](https://www.eventcatalog.dev/docs/development/plugins/generators).

Generators are scripts are run to pre build to generate content in your catalog. Generators can use the [EventCatalog SDK](https://www.eventcatalog.dev/docs/sdk).

With this Confluent Schema Registry plugin you can connect your schema registries to your catalog. You can map your topics to your domains and services and also filter (suffix, prefix, exact matching) for your topics.

This is done by defining your generators in your `eventcatlaog.config.js` file.

```js
...
generators: [
    [
      '@eventcatalog/generator-eventbridge',
      {
        // The url of your Confluent Schema Registry
        url: 'http://localhost:8081',
        services: [
          // Maps exact events to the service
          { id: 'Orders Service', version: '1.0.0', sends: [{ topic: "app.orders.created"}], receives:[{ topic: "app.orders.updated"}] },
          // Filter by topic (all topics that match the filter get assigned to the service). This example shows any event matching the topic
          // "app.orders.created" will be assigned to the inventory service. The inventory service will publish these events.
          { id: 'Inventory Service', version: '1.0.0', sends: [{ prefix: "app.orders-"}], receives:[{ suffix: "app.inventory-"}] },
          // This service sends events that match the SchemaName prefixing myapp, and will receive events that end with Payment
          { id: 'Payment Service', version: '1.0.0', sends: [{ prefix: "app.orders-"}], receives:[{ suffix: "app.inventory-" }] }
        ],
        // All the services are assigned to this domain
        domain: { id: 'orders', name: 'Orders', version: '0.0.1' },
      },
    ],
    // Example of saving all topics directly into EventCatalog without services or domains
    // All topics in registry will be added to the Catalog.
    [
      '@eventcatalog/generator-eventbridge',
      {
        // The url of your Confluent Schema Registry
        url: 'http://localhost:8081',
      },
    ],
  ],
...
```

In this example we have two types of usecases for the generator:

1. Map topics to services and domains using custom filters.
2. Add all topics to EventCatalog regardless of the service or domain.

````

This is example schmeas will get fetched from the registry, and applied to your defined service and domain. When schema versions update in the registry, the generator will update the version in the catalog.

# Getting started

## Installation and configuration

_Make sure you are on the latest version of EventCatalog_.

1. Install the package

```sh
@eventcatalog/generator-confluent-schema-registry
````

2. Configure your `eventcatalog.config.js` file [(see example)](https://github.com/event-catalog/generators/tree/main/examples/generator-confluent-schema-registry/blob/main/eventcatalog.config.js)

3. Set credentials for your Confluent Schema Registry. Create a `.env` file in the root of your project and add the following:

```sh
# From eventcatalog.cloud (14 day free trial)
EVENTCATALOG_LICENSE_KEY_CONFLUENT_SCHEMA_REGISTRY=

# From Confluent Schema Registry
CONFLUENT_SCHEMA_REGISTRY_KEY=
CONFLUENT_SCHEMA_REGISTRY_SECRET=
```

4. Run the generate command

```sh
npm run generate
```

5. See your new domains, services and messages, run

```sh
npm run dev
```

## Found a problem?

Raise a GitHub issue on this project, or contact us on [our Discord server](https://discord.gg/3rjaZMmrAm).

[license-badge]: https://img.shields.io/github/license/event-catalog/eventcatalog.svg?color=yellow
[license]: https://github.com/event-catalog/eventcatalog/blob/main/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[github-watch-badge]: https://img.shields.io/github/watchers/event-catalog/eventcatalog.svg?style=social
[github-watch]: https://github.com/event-catalog/eventcatalog/watchers
[github-star-badge]: https://img.shields.io/github/stars/event-catalog/eventcatalog.svg?style=social
[github-star]: https://github.com/event-catalog/eventcatalog/stargazers

# Commercial Use

This generator requires a license to be used with EventCatalog. You can get a 14 day free trial at https://eventcatalog.cloud or email us at `hello@eventcatalog.dev`.
