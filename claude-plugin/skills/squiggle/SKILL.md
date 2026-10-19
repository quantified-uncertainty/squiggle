---
name: squiggle
description: Write, check, run, and explain Squiggle models. Squiggle is a probabilistic programming language for estimation with distributions (`5 to 10`, `normal`, `mx`, Monte Carlo sampling). Use when the user works with `.squiggle` files or Squiggle code, or asks for a probabilistic estimate, Fermi estimate, back-of-the-envelope model, cost-benefit or cost-effectiveness analysis, forecast with uncertainty, or a relative values model, even if they don't name Squiggle.
when_to_use: Also use when editing models in a Squiggle repo, when fixing Squiggle errors, or when the user wants a model shown in Squiggle Studio, the Squiggle Playground, or VS Code.
---

# Squiggle

Squiggle is a small, immutable, expression-based language. Every value can be a probability distribution, and arithmetic on distributions works through Monte Carlo sampling (1,000 samples by default). It is **not** JavaScript or Python: only use constructs that you have seen in the Squiggle docs. Invented functions are the most common source of failure.

## Workflow

1. **Write the model** in a `.squiggle` file. Follow the style rules below. Look up any function that you aren't sure exists before using it.
2. **Check it**: `squiggle check model.squiggle` reports parse errors, type errors, and lint warnings, with hints, without running the model (it also checks imported files). Add `--run` to also catch runtime errors, `--json` for `{ ok, files, errors, warnings, ran }`, and `--no-warnings` to hide lint warnings. Fix everything it reports.
3. **Run it**: `squiggle run model.squiggle --json` prints one JSON object `{ ok, result, bindings, exports, errors, timeMs }`. `errors` is a list of `{ kind, message, location: { file, start: {line, column}, end } }`; when `ok` is false, `result` is `null` and `bindings` is `{}`. Distributions are summarized as `{ type: "Dist", subtype, mean, stdev, p5, p25, p50, p75, p95, min, max, sampleCount }`; dicts and lists become JSON objects and arrays, and functions become `{ type: "Lambda", signature, ... }`. Use `--seed <s>` for reproducible numbers, `-n/--sample-count <n>` for more precision, `--samples <N>` to include up to N raw samples per sample-set distribution, and `-w/--watch` to re-run when the file or its imports change. The exit code is 1 if the model fails.
4. **Sanity-check the numbers**, not just the absence of errors. Are the p5 to p95 ranges plausible? Are probabilities between 0 and 1? Is anything negative that can't be? Is an extreme probability (below 5% or above 95%) actually justified? Iterate on inputs and structure.
5. **Show the user** the model (see "Showing results" below) and summarize the key outputs with their ranges, and the inputs that drive them.

To try out a snippet without a file: `squiggle run -e 'x = 5 to 10
mean(x)'` (`check` takes `-e` too).

### Getting the CLI

The CLI is the `squiggle` binary from the `@quri/squiggle-lang` npm package.

- Inside the Squiggle monorepo, use `node packages/squiggle-lang/bin/squiggle.js <command>` (build `packages/squiggle-lang` first).
- Otherwise, if `squiggle` is on the PATH, or via `npx -y @quri/squiggle-lang <command> ...`.

The commands and flags on this page (`check`, `docs`, `run --json`, `--seed`, `--samples`, `--watch`) are in squiggle-lang 0.10.1, which isn't published to npm yet; the published 0.10.0 only has `run` (text output). With an older CLI, use `squiggle run <file>`, which prints errors and bindings as text, and look up functions in [reference/language.md](reference/language.md). Run `squiggle --help` to see what the installed version supports.

## Looking up functions

- `squiggle docs Dist.normal` shows the signatures, description, and examples for one builtin.
- `squiggle docs normal` searches builtins by name or text. `squiggle docs Dist` lists the functions in a namespace, and `squiggle docs -l` (`--list`) lists all namespaces. Add `--json` for machine-readable output.
- [reference/language.md](reference/language.md) is the full documentation bundle (about 120 KB): common mistakes, guides, and every builtin module. Grep it for a module or function name (for example `# Builtin module: List`) instead of reading all of it.

Functions that LLMs often invent but that **don't exist**: `List.sum` (use `Number.sum` or `Dist.sum`), `List.map2`, `List.keys`, `List.sample`, `List.repeat` (use `List.make`), `List.sort` (use `List.sortBy` or `Number.sort`), `Number.parseFloat`, `Duration.toMonths`, `Date.now` (use `Danger.now`), `random()` (use `sample(uniform(0, 1))`).

## Language essentials

```squiggle
// Comments use // or /* */, never #
population = 8M to 8.8M          // `a to b` is a lognormal with p5 = a, p95 = b; a must be > 0
share = beta(2, 30)               // beta(alpha, beta) or beta({mean, stdev})
growth = normal({ p5: -1%, p95: 4% })  // use normal() when values can be negative
robust = mx([300 to 400, 50 to 5000], [0.9, 0.1])  // mixture: a wide tail for surprises
positive = truncateLeft(normal(3, 2), 0)

@name("Cost per Year ($)")        // tags apply to the next variable only
@format("$,.0f")
costPerYear = {
  units = 100 to 300              // blocks: assignments, then one final expression
  pricePerUnit = 20 to 40
  units * pricePerUnit            // the last expression is the block's value; no `return`
}

f(t: [Date(2024), Date(2040)]) = Duration.toYears(t - Date(2024))  // domains restrict arguments
double = {|x| x * 2}             // anonymous function; there is no `=>`
total = [1, 2, 3] -> List.map(double) -> Number.sum   // pipes are `->`, not `|>`
label = if mean(costPerYear) > 5k then "high" else "low"  // `if` always needs `else`
```

## Top pitfalls

- **Every top-level statement except the last must be an assignment.** A bare expression followed by more code is a parse error. A block must end in exactly one expression.
- **No mutation, loops, `let`, `return`, `+=`, `%`, `null`/`undefined`, `Infinity`, recursion, or switch.** Use `List.map`, `List.reduce`, `List.upTo(a, b)` (not `0..n`), `Number.mod`, `Number.maxValue`.
- **Variable names and dict keys start lowercase.** Use camelCase.
- **`a to b` requires 0 < a < b.** For ranges that include zero or negatives, use `normal({ p5: a, p95: b })`.
- **`stdev`, not `sd`**: `normal({ mean: 0.3, stdev: 0.1 })`.
- **No type annotations.** `f(x: Number)` is invalid. The only parameter annotations are numeric or date ranges: `f(n: [1, 10])`, `f(t: [Date(2020), Date(2030)])`. Functions with range domains can't be called with distributions.
- **Two dict syntaxes.** `{a: 1, b: 2}` is a plain dict whose values can't reference each other. `{ a = 1; b = a + 1; {a, b} }` (newlines, no commas) is a block that returns a dict. Tags (`@name`) only work in the block form. Don't end block assignments with commas.
- **Imports go at the top of the file**, and the CLI only resolves relative imports (`import "./lib.squiggle" as lib`). Hub imports such as `import "hub:ozziegooen/sTest" as sTest` work on Squiggle Hub and in Squiggle Studio (including `squiggle-studio run`), but not in the `squiggle` CLI.
- **Annotations stay together.** No blank lines or comments between `@name(...)`, `@doc(...)`, `@format(...)` and the variable they tag. `@format` can't be used on functions, lists, or dicts.
- **`String(x)` of a tagged value includes its tags.** Use `Tag.clear(x)` or an untagged variable before interpolating into strings, and format numbers with `String(x, ",.2f")`. For a distribution, show a range: `String(Dist.inv(d, 0.05), ",.0f") + " to " + String(Dist.inv(d, 0.95), ",.0f")`.
- **Sample-set correlation.** Distributions derived from the same samples stay correlated (`x - x` is 0). Converting to point sets or symbolic dists breaks that. Plots smooth samples with KDE, so a positive distribution can show a little mass below 0.
- **Lines can't start with a binary operator** like `+` or `-`. Break long expressions after the operator, or start the next line with `->`.

When `squiggle check` or `run` reports an error you don't understand, grep [reference/language.md](reference/language.md) for the function involved. The "Common mistakes" section at the top of that file explains most parse errors.

## Style rules

These are distilled from the full guide in [reference/style-guide.md](reference/style-guide.md). Read it before writing a long or user-facing model.

- **Calibration.** `a to b` is a 90% interval, so be paranoid about overconfidence. Speculative quantities may need several orders of magnitude (`100 to 100k`). When you could be badly wrong, mix in a wide component: `mx([50k to 60k, 1k to 1M], [0.95, 0.05])`. Avoid uniform and triangular distributions for real-world uncertainty. Be suspicious of extreme output probabilities.
- **Decompose** inputs that are large, uncertain, and divisible into components.
- **Constrain values.** Use lognormal (`to`) or truncation for positive values, and `beta` or truncation for probabilities. Prefer domains over `if ... then throw(...)`.
- **Structure.** Start with a 1-2 line comment summarizing the model. Group inputs in a block, keep fewer than about 10 variables in scope, and add `// ===== Section =====` headers in files over 50 lines. Use lists of dicts, not lists of lists, for structured data.
- **Naming and units.** Use camelCase. Give `@name` a unit and context, like `@name("US Population (2024)")` or `@name("Ball Speed (m/s)")`. Use `@doc` to explain assumptions and flag speculative inputs. Keep related variables in the same units. Don't use the beta `::` unit syntax.
- **Numbers.** Write `331.9M`, `7.8B`, `10k`, `1e12`, and `5%`, not `331.9` with a "(millions)" label, `10000`, or `0.05`.
- **Display.** Use `@format(".0%")` for percentages and `@format("$,.0f")` for dollars. Add `@hide` to small helpers. Use `@showAs` with `Table.make` for lists of records, and `Plot.dists` to compare 2-8 distributions. Use `Scale.log()` or `Scale.symlog()` for skewed data.
- **Summary.** For models over a few dozen lines, end the file with a `@notebook @startOpen summary = [...]` list that alternates markdown strings and dicts of variables, covering the description, key outputs, assumptions, and surprises. Nothing comes after it.
- **Comments** explain reasoning and uncertainty. Don't restate the code or narrate your edits.

[reference/examples.md](reference/examples.md) has complete, verified models: a Fermi estimate, a cost-benefit analysis with a summary notebook, a function over time with a table, and a calculator.

## Showing results

Pick whichever fits the user's setup:

- **Squiggle Studio**: `squiggle-studio [dir] [--port 4321] [--no-open]` opens a local editor with an Explorer, live output, a relative values dashboard and a playground; it shows your edits on disk as you make them, so it's the best way to iterate with the user watching. It autosaves the user's edits about 1 s after they stop typing, so re-read a file if an edit fails with "file modified since read". Without a running Studio, `squiggle-studio run <file> --json` prints values and errors (it resolves `hub:` and `../` imports, unlike the `squiggle` CLI), `squiggle-studio rv <file> --format csv` prints a relative values matrix, and `squiggle-studio render <file> --json --scale 1` writes a PNG to check the visuals (it needs `puppeteer-core` and a local Chrome). Take numbers from JSON, not pixels. Studio isn't published to npm yet; see the `studio` skill for how to run it from the Squiggle monorepo and how to show the user results.
- **Web playground link**: `node ${CLAUDE_SKILL_DIR}/scripts/playground-url.mjs model.squiggle` prints a https://squiggle-language.com/playground link with the code embedded. Good for sharing; very large models make very long URLs.
- **Online playground**: `squiggle playground` opens the empty online playground in a browser (`--print-url` prints the URL instead). To open it with code, use the `playground-url.mjs` script above.
- **VS Code**: the [Squiggle extension](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle) adds syntax highlighting and a live preview for `.squiggle` files.
- **Squiggle Hub** (squigglehub.org) hosts and versions models, and supports hub imports.

In chat, report the headline numbers from `squiggle run --json` (mean and the p5 to p95 range), with units, and say which inputs drive the result.

## Relative values

Relative values models estimate the value of many items relative to each other, as ratios of distributions. Write them as a top-level dict `{ items, fn: {|a, b| [distA, distB]} }` or `{ values: { id: dist, ... } }`, with optional `title`, `clusters` and `recommendedUnit`. Squiggle Studio shows them in a **Relative values** tab with List, Grid, and Plot views. See [reference/relative-values.md](reference/relative-values.md).
