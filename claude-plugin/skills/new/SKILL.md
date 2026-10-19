---
name: new
description: Scaffold a new Squiggle model from a question, check it, run it, and report the results.
argument-hint: "[question or topic to model]"
disable-model-invocation: true
---

Create a new Squiggle model for: $ARGUMENTS

If no topic was given, ask the user what they want to estimate before doing anything else.

1. Load the `squiggle` skill and follow its workflow and style rules. Use `${CLAUDE_PLUGIN_ROOT}/skills/squiggle/reference/examples.md` as a template.
2. Pick a short kebab-case filename that describes the question, such as `piano-tuners-nyc.squiggle`, in the current directory (or a `models/` directory if the project has one). Don't overwrite an existing file.
3. Write the model: a 1-2 line summary comment, an inputs block with calibrated, tagged inputs, the calculations, and, for models over about 30 lines, a final `@notebook` summary.
4. Run `squiggle check <file>`, then `squiggle run <file> --json`. Fix every error and recheck. Then sanity-check the output ranges and revise inputs that look overconfident.
5. Report the file path, the headline result (mean and p5 to p95, with units), the two or three inputs that matter most, and how to view the model (Squiggle Studio if available, or a playground link from the skill's `playground-url.mjs` script).
