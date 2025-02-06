# EventCatalog Generators

This repository contains the generators for the EventCatalog project.

## Integration list with EventCatalog

- [OpenAPI](./packages/generator-openapi/README.md)
  - [Documentation](https://www.eventcatalog.dev/integrations/openapi)
  - [Example Projects](./examples/generator-openapi/)
- [AsyncAPI](./packages/generator-asyncapi/README.md)
  - [Documentation](https://www.eventcatalog.dev/integrations/asyncapi)
  - [Example Projects](./examples/generator-asyncapi/)
- [EventCatalog Federation](./packages/generator-federation/README.md)
  - [Documentation](https://www.eventcatalog.dev/federation)
- [Amazon EventBridge](./packages/generator-eventbridge/README.md)
  - [Documentation](https://www.eventcatalog.dev/integrations/eventbridge)
- [Backstage](https://github.com/event-catalog/backstage-plugin-eventcatalog)
  - [Documentation](https://www.eventcatalog.dev/integrations/backstage)

All plugins require a license key. You can get a license key from [EventCatalog Cloud](https://eventcatalog.cloud).

---

## Examples

**OpenAPI Integrations**

- [Integrate OpenAPI files into EventCatalog](./examples/generator-openapi/)
- [Integrate OpenAPI files from remote URLs into EventCatalog](./examples/generator-openapi/fetch-from-remote-urls/)
- [Independent Message Versioning using the `x-eventcatalog-message-version` extension](./examples/generator-openapi/independent-message-versioning/)

**AsyncAPI Integrations**

- [Integrate AsyncAPI files into EventCatalog](./examples/generator-asyncapi/)
- [Integrate AsyncAPI files from remote URLs into EventCatalog](./examples/generator-asyncapi/fetch-from-remote-urls/)
- [Mapping commands, events and queries using the `x-eventcatalog-message-type` extension](./examples/generator-asyncapi/mapping-commands-events-queries/)
- [Independent Message Versioning using the `x-eventcatalog-message-version` extension](./examples/generator-asyncapi/independent-message-versioning/)
- [Message Ownership using the `x-eventcatalog-role` extension to control which service owns a message](./examples/generator-asyncapi/message-ownership/)
  - EventCatalog will parse all messages, sometimes this leads to duplicated messages being created.
  - The `x-eventcatalog-role` extension can be used to control which service owns a message.
  - This is useful when you have multiple AsyncAPI files that define the same message.

**EventBridge Integrations**

- [Integrate EventBridge files into EventCatalog](./examples/generator-eventbridge/)

**Backstage Integrations**

- [Integrate Backstage plugin into EventCatalog](./examples/backstage-plugin/)

**Multi Generator Example**

- [Integrate multiple generators (AsyncAPI and OpenAPI) into EventCatalog](./examples/multi-generator-example/)

---

## Found a problem?

Raise a GitHub issue on this project, or contact us on [our Discord server](https://discord.gg/3rjaZMmrAm).

## Commercial use

All plugins are licensed under a [dual-license](./LICENSE.md). To ensure the sustainability of the project, you can freely make use of this software if your projects are Open Source. Otherwise for internal systems you must obtain a [commercial license](./LICENSE-COMMERCIAL.md).

If you would like to obtain a Commercial License, you can get a free trial (14 days) per plugin at https://eventcatalog.cloud or email us at `hello@eventcatalog.dev`

# Sponsors

Thank you to our project sponsors.

## Gold sponsors

<div align="center">
  <img alt="gravitee" src="./images/sponsors/gravitee-logo-black.svg" width="50%" />
  <p style="margin: 0; padding: 0;">Manage, secure, and govern every API in your organization</p>
  <a href="https://gravitee.io?utm_source=eventcatalog&utm_medium=web&utm_campaign=sponsorship" target="_blank" >Learn more</a>
</div>

<hr />

<div align="center">
  <img alt="oso" src="./images/sponsors/oso-logo-green.png" width="40%" />
  <p style="margin: 0; padding: 0;">Delivering Apache Kafka professional services to your business</p>
  <a href="https://oso.sh/?utm_source=eventcatalog&utm_medium=web&utm_campaign=sponsorship" target="_blank" >Learn more</a>
</div>

<hr />

_Sponsors help make EventCatalog sustainable, want to help the project? Get in touch! Or [visit our sponsor page](https://github.com/sponsors/event-catalog)._

# Enterprise support

Interested in collaborating with us? Our offerings include dedicated support, priority assistance, feature development, custom integrations, and more.

Find more details on our [services page](https://eventcatalog.dev/services).

# Contributing

If you have any questions, features or issues please raise any issue or pull requests you like. We will try my best to get back to you.

You can find the [contributing guidelines here](https://eventcatalog.dev/docs/contributing/overview).
