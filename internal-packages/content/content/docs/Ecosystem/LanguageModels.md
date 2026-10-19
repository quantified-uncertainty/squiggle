---
title: Language Models
description: Use Squiggle with Language Models
---

Large language models can write good Squiggle code, especially when they have the documentation in context and can run their code to check it. This page lists the tools we provide for that.

## Coding agents (Claude Code and others)

### Claude Code plugin

The Squiggle repository is a [Claude Code](https://code.claude.com) plugin marketplace. To install the plugin, run these commands inside Claude Code:

```
/plugin marketplace add quantified-uncertainty/squiggle
/plugin install squiggle@quantified-uncertainty
```

The plugin adds a `squiggle` skill that Claude loads automatically when you work with `.squiggle` files or ask for a probabilistic estimate. It teaches Claude the write, check, run, and iterate workflow below, the most common mistakes, and the [style guide](./LLMStyleGuide), and includes the full documentation as a reference. It also adds two commands: `/squiggle:new <question>` scaffolds a new model, and `/squiggle:studio` launches Squiggle Studio. The plugin's source is in [`claude-plugin/`](https://github.com/quantified-uncertainty/squiggle/tree/main/claude-plugin).

### The `squiggle` CLI

Any coding agent can use the CLI from [`@quri/squiggle-lang`](https://www.npmjs.com/package/@quri/squiggle-lang) (`npx @quri/squiggle-lang <command>`) to check its own work:

- `squiggle check model.squiggle` reports errors and warnings, with hints for common mistakes.
- `squiggle run model.squiggle --json` evaluates a model and prints the result and variables as JSON, with distributions summarized by their mean, standard deviation, and percentiles. `--seed` and `--sample-count` control sampling.
- `squiggle docs Dist.normal` shows the documentation for a builtin function offline. `squiggle docs --list` lists all of them.

### llms.txt

This site follows the [llms.txt](https://llmstxt.org/) convention:

- [/llms.txt](/llms.txt) is a short index of these docs.
- [/llms-full.txt](/llms-full.txt) is all of the documentation in one plain-text file.

Add either to an agent's context, or point a tool that understands llms.txt at the site.

## Squiggle GPT

We have an experimental [Squiggle GPT](https://chat.openai.com/g/g-xztB5cnaw-squiggle-language-bot-alpha). It has access to the Squiggle documentation, and can call our server to check if code it produces is correct, or to generally run code and response with its results.

This bot often produces poor results, or fails to properly call the server, so it requires some handholding. If this is an issue for you, let us know.

## Document with all documentation

[All Squiggle Documentation, in One Document](/llms-full.txt) (also available at [/api/documentation-bundle](/api/documentation-bundle))

If you want a shorter prompt, you can use [this shorter prompt](./BasicPrompt).

If you might be interested in training or fine-tuning language models for writing Squiggle, let us know!

## Instructions for use with chat interfaces

1. Copy the Squiggle documentation file listed above.
2. Go to a chat interface with a large context window, like [Claude](https://claude.ai). Paste the file.
3. Ask a question, like, `"Write a Squiggle model to estimate the costs of taking a plane flight from SFO to London. Include the environmental impact, social impact, cost of ticket, cost of time, cost of jet lag."`
4. You should get an attempt at a Squiggle Model. Try it out in the Squiggle Playground. There will likely be a few errors, so try fixing these errors.
