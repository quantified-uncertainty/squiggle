---
"@quri/squiggle-lang": minor
---

CLI improvements for scripting and coding agents:

- `squiggle run --json` prints a single JSON object with the result, bindings, exports and structured errors (kind, message, location, stack, hints). Distributions are summarized (mean, stdev, percentiles); `--samples N` includes raw samples.
- `squiggle run` accepts `--seed`, `--sample-count` (`SAMPLE_COUNT` still works) and `--watch`.
- New `squiggle check` command: type-checks a file and its imports without running it, with actionable hints for common mistakes and lint warnings. `--run` also evaluates it.
- New `squiggle docs` command: offline documentation for builtin functions (`squiggle docs Dist.normal`, `squiggle docs List`, `squiggle docs --list`).
- New exports: `sqValueToJson`, `sqDistributionSummary`, `getErrorHints`, `getCodeWarnings`, `suggestBuiltinNames` and `getAllFunctionDocumentation`.
