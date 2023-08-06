---
description: Link to LLM documentation
---

# Use with Language Models

There are not yet any language models trained on Squiggle. However, we have compiled our documentation and grammar into one document. You can use this with Anthropic's [Claude](https://www.anthropic.com/index/introducing-claude) chat interface or other interfaces with large context windows, after which you can get Squiggle help. We've found that it's able to get Squiggle code mostly correct, but often needs some manual assistance.

Manual training LLMs for writing Squiggle could make for a great project. If you might be interested in doing this, let us know!

## Document with all documentation

[All Squiggle Documentation, in One Document](https://raw.githubusercontent.com/quantified-uncertainty/squiggle/main/packages/website/allContent.txt)

## Instructions for use with Claude

1. Copy the Squiggle documentation file listed above.
2. Go to the [Claude Chat Interface](https://console.anthropic.com/claude). Paste the file.
3. Ask a question, like, `"Write a Squiggle model to estimate the costs of taking a plane flight from SFO to London. Include Include the environmental impact, social impact, cost of ticket, cost of time, cost of jet lag."`
4. You should get an attempt at a Squiggle Model. Try it out in the Squiggle Playground. There will likely be a few errors, so try fixing these errors.
