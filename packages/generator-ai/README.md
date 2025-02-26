<div align="center">

<h1>⚡️ EventCatalog AI Assistant - Generator </h1>
<p>Talk to your architecture with the EventCatalog AI Assistant</p>

[![PRs Welcome][prs-badge]][prs]
<img src="https://img.shields.io/github/actions/workflow/status/event-catalog/generator-eventbridge/verify-build.yml"/>
[![](https://dcbadge.limes.pink/api/server/https://discord.gg/3rjaZMmrAm?style=flat)](https://discord.gg/3rjaZMmrAm) [<img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" height="20px" />](https://www.linkedin.com/in/david-boyne/) [![blog](https://img.shields.io/badge/blog-EDA--Visuals-brightgreen)](https://eda-visuals.boyney.io/?utm_source=event-catalog-gihub) [![blog](https://img.shields.io/badge/license-Dual--License-brightgreen)](https://github.com/event-catalog/generator-eventbridge/blob/main/LICENSE.md)

<img alt="header" src="https://github.com/event-catalog/generators/blob/main/images/ai.png?raw=true" />

<h4>Features: Use natural language to ask questions about your EventCatalog, use the AI Assistant to get answers. Local first, no data leaves your computer. </h4>

[Read the Docs](https://eventcatalog.dev/) | [Edit the Docs](https://github.com/event-catalog/docs) | [View Demo](https://demo.eventcatalog.dev/docs)

</div>

<hr/>

# Core Features

- 🗣️ Use natural language to ask questions about your EventCatalog
- 🔐 Local first, no data leaves your computer
- 🔐 Private and secure, your data is yours
- 📚 Unlimited questions and answers (no token limits, or API keys required)
- 📚 Reduce the time it takes to learn and understand your architecture
- ⭐ And much more...

# How it works

[EventCatalog](https://www.eventcatalog.dev/) is technology agnostic, meaning it can integrate with any schemas, specs or brokers.

EventCatalog supports [generators](https://www.eventcatalog.dev/docs/development/plugins/generators).
Generators are scripts are run to pre build to generate content in your catalog. Generators can use the [EventCatalog SDK](https://www.eventcatalog.dev/docs/sdk).

With this EventCatalog plugin embeddings are generated based on your EventCatalog. These embeddings are stored and use by EventCatalog, all locally in your project and on your computer. Once you generate the embeddings with this generator, and configure your EventCatalog project, you can use the AI Assistant to ask questions about your catalog.

EventCatalog uses [Webllm](https://webllm.mlc.ai/) to run the models in your browser and [Transformers.js](https://huggingface.co/docs/transformers.js/en/index) to do vector searches in your browser.

You can pick which model you want to use, and EventCatalog will download the model for you enabling you to use the AI Assistant.

```js
...
generators: [
    [
      '@eventcatalog/generator-ai',
      {
        // This will split the markdown files into smaller chunks, this is optional and defaults to false
        // This uses MarkdownTextSplitter under the hood
        splitMarkdownFiles: false,

        // optional embedding model to use, defaults to Llama-3.2-3B-Instruct-q4f16_1-MLC
        // shouldnt need to change this, unless you want to play with models and embeddings
        // Find list of models here: https://www.eventcatalog.dev/docs/development/guides/eventcatlaog-chat/models
        embedingModel: 'Xenova/all-MiniLM-L6-v2',

        // optional similarity results to use, defaults to 10
        similarityResults: 40,

        // optional max tokens to use, defaults to 4096, map to your model
        maxTokens: 4096,

      },
    ]
  ],
...
```

In this example we install and setup the generator. This will parse all our catalogs files and create a new folder called `/generated-ai` with the following files:

- `documents.json` - Contains the processed documents and their metadata for the LLM model in EventCatalog
- `embeddings.json` - Contains vector embeddings for the documents. These are used by EventCatalog to do vector searches.
- `README.md` - This file just tells you that these files are generated, and not to edit them

# Getting started

## Installation and configuration

_Make sure you are on the latest version of EventCatalog_.

1. Install the package

```sh
@eventcatalog/generator-ai
```

2. Configure your `eventcatalog.config.js` file [(see example)](https://github.com/event-catalog/eventcatalog-ai-example/blob/main/eventcatalog.config.js)

3. Run the generate command

```sh
npm run generate
```

4. Configure your EventCatalog project, turn on the chat feature.

```js
{
    chat: {
        enabled: true,
    }
}
```

5. Start your project and go to `/chat` to see the AI Assistant or use the link on the sidebar.

```sh
npm run dev
```

## Found a problem?

Raise a GitHub issue on this project, or contact us on [our Discord server](https://discord.gg/3rjaZMmrAm).

# Sponsors

Thank you to our project sponsors.

## Gold sponsors

<div align="center">
  <img alt="gravitee" src="../../images/sponsors/gravitee-logo-black.svg" width="50%" />
  <p style="margin: 0; padding: 0;">Manage, secure, and govern every API in your organization</p>
  <a href="https://gravitee.io?utm_source=eventcatalog&utm_medium=web&utm_campaign=sponsorship" target="_blank" >Learn more</a>
</div>

<hr />

<div align="center">
  <img alt="oso" src="../../images/sponsors/oso-logo-green.png" width="40%" />
  <p style="margin: 0; padding: 0;">Delivering Apache Kafka professional services to your business</p>
  <a href="https://oso.sh/?utm_source=eventcatalog&utm_medium=web&utm_campaign=sponsorship" target="_blank" >Learn more</a>
</div>

<hr />

_Sponsors help make EventCatalog sustainable, want to help the project? Get in touch! Or [visit our sponsor page](https://www.eventcatalog.dev/support)._

# Enterprise support

Interested in collaborating with us? Our offerings include dedicated support, priority assistance, feature development, custom integrations, and more.

Find more details on our [services page](https://eventcatalog.dev/services).

# Contributing

If you have any questions, features or issues please raise any issue or pull requests you like. We will try my best to get back to you.

You can find the [contributing guidelines here](https://eventcatalog.dev/docs/contributing/overview).

## Running the project locally

1. Clone the repo
1. Install required dependencies `pnpm i`
1. Run tests `pnpm run tests`

[license-badge]: https://img.shields.io/github/license/event-catalog/eventcatalog.svg?color=yellow
[license]: https://github.com/event-catalog/eventcatalog/blob/main/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[github-watch-badge]: https://img.shields.io/github/watchers/event-catalog/eventcatalog.svg?style=social
[github-watch]: https://github.com/event-catalog/eventcatalog/watchers
[github-star-badge]: https://img.shields.io/github/stars/event-catalog/eventcatalog.svg?style=social
[github-star]: https://github.com/event-catalog/eventcatalog/stargazers

# Commercial Use

This project is governed by a [dual-license](./LICENSE.md). To ensure the sustainability of the project, you can freely make use of this software if your projects are Open Source. Otherwise for proprietary systems you must obtain a [commercial license](./LICENSE-COMMERCIAL.md).

If you would like to obtain a Commercial License, you can purchase a license at https://eventcatalog.cloud or email us at `hello@eventcatalog.dev`.
