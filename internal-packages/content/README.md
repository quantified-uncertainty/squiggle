Internal package for maintaining [Content Collections](https://www.content-collections.dev/).

Collections configuration is in `src/collections`.

We have several collections:

- `docs` and `meta` for fumadocs, to be used in the website
- `apiDocs` for injecting API docs into the website
- `rawApiDocs` for using API docs in AI system prompt
- `squiggleAiLibraries` for Squiggle libraries that are available to use in AI system prompts

This package re-exports all generated content collections, as well as a some helper functions for working with them.
