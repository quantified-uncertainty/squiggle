---
"@quri/squiggle-lang": minor
---

The JSON serializers behind `squiggle run --json` and `squiggle check --json` are now public and browser-safe: `sqModuleOutputToJson(output, sources, {samples?})`, `sqErrorToJson(error, sources)`, `exceptionToErrorJson`, `warningsForSources`, and the `RunJson`, `ErrorJson`, `LocationJson` and `WarningJson` types. Tools that run Squiggle elsewhere (Squiggle Studio's CLI and its in-page agent API) produce exactly the CLI's JSON. Also new: `formatSqNumber(value, format?)`, which formats a number with an `@format` specifier or compactly. The CLI's output is unchanged.
