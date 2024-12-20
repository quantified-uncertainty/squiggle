---
title: Squiggle AI
---

![Squiggle AI](https://squigglehub.org/ai)

Squiggle AI is a tool that allows you to write and improve Squiggle code using natural language. It's hosted on SquiggleHub, where you must be logged in to use it.

## Tips for Effective Use

1. Provide comprehensive background information in your prompts, as Squiggle AI doesn't perform web searches.
2. Be very specific about what kinds of analysis to perform.
3. Request cost-effectiveness models, which are particularly suited to Squiggle.
4. For tricky calculations or estimates, you might want to first add [O1] or other expensive language models. Then copy & paste the results into Squiggle AI.
5. Run 2-4 workflows for the same prompt. Different prompts often lead to very different outputs.
6. Begin with 0 numeric steps and 0 documentation steps. You can easily add these later.
7. Be sure to review all key assumptions and to adjust critical parameters.

## Limitations

- **2-minute** runtime cap
- **$0.30** cost limit per run
- **Single file** operations only
- Typical output: **~100 lines of code**
- Limited access to SquiggleHub libraries

## Performance and Costs

LLMs, while powerful, can be slow and expensive. Short runs typically take 10-30s and cost \$0.01 to \$0.05, while longer runs can take 1-3 minutes and cost \$0.10 to \$0.30.

The fact that Squiggle is a new language means that more fixes are generally required than would be the case for popular languages.

## LLM Specifics

Squiggle AI currently uses Claude Sonnet 3.5 for all operations. It makes use of [prompt caching](https://www.anthropic.com/news/prompt-caching) to cache a lot of information (around 20k tokens) about the Squiggle language. LLM queries typically cost around $0.002 to $0.02 each to run \- more in the case of large models or long execution runs.

You can see most of the prompts used [here](https://github.com/quantified-uncertainty/squiggle/blob/main/internal-packages/ai/src/prompts.ts).

## Key Run Stages

There are four main stages to writing Squiggle with LLMs. Each has its own LLM prompt and logic.

1. **Generation**: Makes a first attempt at writing Squiggle code, based on a certain prompt.
2. **Bug Fixing**: Attempts to fix errors in Squiggle code. Typically, each LLM call attempts to fix one error at a time. This is used when the Squiggle code can't run at all or if it gives parser errors.
3. **Update Estimates**: Checks the results of the model. If it notices broken tests or numbers that seem suspicious, goes back and suggests changes to the model.
4. **Document**: Recommends improvements to match the style guide. This typically means improving variable annotation and model documentation, but it sometimes also means adjusting variables or code organization.

## Future Functionality

Ideas for future features include:

1. Web searches: Allowing Squiggle AI to do background research on variables using services like Perplexity or specific APIs like those of Metaforecast and Manifold.
2. LLM forecasting integration: Developing a dedicated system for estimating specific parameters to improve accuracy.
3. API & Local support: Expanding support for API requests and possibly providing a local-only solution.
4. Support for larger codebases: Enabling work on multiple files and continuous improvement of larger codebases.
5. Use-case optimization: Improving handling of common use-cases like relative value functions, financial projections, and complex generated data.
6. Evaluations: Developing benchmarks for higher-level, general-purpose mathematical models.
7. A fine-tuned model: Using a fine-tuned model instead of Claude with a long prompt could be more effective.
