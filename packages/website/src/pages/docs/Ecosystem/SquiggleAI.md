---
description: Squiggle AI
---

# Squiggle AI

Squiggle AI is a tool that allows you to interact with Squiggle code using natural language. It is powered by a large language model (LLM) that can understand and generate human-like text.

Squiggle AI is hosted on SquiggleHub, and you can access it [here](https://squiggle.dev/ai). You must be logged in to SquiggleHub to use it. 

![Squiggle AI](/img/squiggleAI.png)

## Tips for Effective Use

1. Request cost-effectiveness models, which are particularly suited to Squiggle.  
2. Provide comprehensive background information in your prompts, as AutoSquiggle doesn't perform web searches.  
3. Run multiple iterations for diverse results, then combine or average them for optimal outcomes.

## Limitations

* **3-minute** runtime cap  
* **$0.30** cost limit per run  
* Limited access to SquiggleHub libraries  
* **Single file** operations only  
* Typical output: **\~80 lines of code** (soft limit)

## Performance and Costs

LLMs, while powerful, can be slow and expensive. Short runs typically take 10-30s and cost \$0.01 to \$0.05, while longer runs can take 1-3 minutes and cost \$0.06 to \$0.40. Expect this delay as processing occurs in the backend.

The fact that Squiggle is a new language means that more fixes are generally required than would be the case for popular languages.

## LLM Specifics

AutoSquiggle currently uses Claude Sonnet 3.5 for all operations. It makes use of [prompt caching](https://www.anthropic.com/news/prompt-caching) to cache a lot of information (around 20k tokens) about the Squiggle language. LLM queries typically cost around $0.002 to $0.02 each to run \- more in the case of large models or long execution runs. 

You can see most of the prompts used [here](https://github.com/quantified-uncertainty/squiggle/blob/main/packages/llmRunner/src/llmRunner/prompts.ts). 

## Key Run Stages

There are three main stages to writing Squiggle with LLMs. Each has its own LLM prompt and logic.

1. **Generation**: Makes a first attempt at writing Squiggle code, based on a certain prompt.  
2. **Bug Fixing** (FIX\_CODE\_UNTIL\_IT\_RUNS): Attempts to fix errors in Squiggle code. Typically, each LLM call attempts to fix one error at a time. This is used when the Squiggle code can't run at all or if it gives parser errors.  
3. **Improvement** (ADJUST\_TO\_FEEDBACK): At this point, the code should run. This stage adjusts to the run results and improves the codebase by adding better variable names, annotations, etc.

**Bug Fixing** continues until the Squiggle code runs. During **Improvement**, if no improvement is found, it finishes. If an improvement is found, it tries to make that improvement and goes back to **Bug Fixing**.

## Future Functionality

We're interested in several enhancements:

**1\. A fine-tuned model:** Using a fine-tuned model instead of Claude with a long prompt could be more effective.

**2\. Web searches:** Allowing AutoSquiggle to do background research on variables using services like Perplexity or specific APIs like those of Metaforecast and Manifold.

**3\. LLM forecasting integration:** Developing a dedicated system for estimating specific parameters to improve accuracy.

**4\. API & Local support:** Expanding support for API requests and possibly providing a local-only solution.

**5\. Support for larger codebases:** Enabling work on multiple files and continuous improvement of larger codebases.

**6\. Use-case optimization:** Improving handling of common use-cases like relative value functions, financial projections, and complex generated data.

**7\. Evaluations:** Developing benchmarks for higher-level, general-purpose mathematical models.

Additional future ideas include:

* Creating multiple runs simultaneously  
* Text summaries of AutoSquiggle runs  
* Better visualizations of runs as they happen  
* User-provided Anthropic keys  
* Saved history of user AutoSquiggle runs  
* Chat interface with AutoSquiggle function calls  
* Code-completion within Squiggle editors  
* Support for other probabilistic estimation languages  
* Visualizations of Squiggle calculations in graphical diagrams  
* Quick up-front estimation of run costs and benefits  
* Squiggle enhancements for AI-written code  
* Code analysis for existing Squiggle code  
* A curated repository of human-overseen Squiggle models  
* Generation of Mermaid diagrams to explain reasoning
