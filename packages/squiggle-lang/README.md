[![npm version](https://badge.fury.io/js/@quri%2Fsquiggle-lang.svg)](https://www.npmjs.com/package/@quri/squiggle-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/main/LICENSE)

# Squiggle language

_An estimation language_

# Use the `npm` package

For instance, in a javascript project, you can

```sh
npm add @quri/squiggle-lang # or `yarn add`, or `pnpm add`
```

The `@quri/squiggle-lang` package exports a single function, `run`, which given
a string of Squiggle code, will execute the code and return any exports and the
environment created from the squiggle code.

```js
import { run, defaultEnvironment } from "@quri/squiggle-lang";
run(
  "normal(0, 1) * SampleSet.fromList([-3, 2,-1,1,2,3,3,3,4,9])"
).result.value.value.toSparkline(defaultEnvironment).value;
```

**However, for most use cases you'll prefer to use our [library of React components](https://www.npmjs.com/package/@quri/squiggle-components)**, and let your app transitively depend on `@quri/squiggle-lang`.

`run` has two optional arguments. The first optional argument allows you to set
sampling settings for Squiggle when representing distributions. The second optional
argument allows you to pass an environment configuration that allows you to control
distribution settings.

The return type of `run` is a bit complicated. We highly recommend using typescript
when using this library to help navigate the return type.

# Command-line interface

The package ships a `squiggle` binary (`npx @quri/squiggle-lang <command>`, or `squiggle` after a global install).

```sh
squiggle run model.squiggle                 # evaluate a file and print the result
squiggle run -e "2 to 10"                   # evaluate a code string
squiggle run model.squiggle --json          # one JSON object: {ok, result, bindings, exports, errors, timeMs}
squiggle run model.squiggle --seed 42 -n 10000   # fixed seed, 10000 samples (SAMPLE_COUNT env also works)
squiggle run model.squiggle --watch         # re-run when the file or its relative imports change
squiggle check model.squiggle [--json]      # type-check file + imports without running; errors with hints, lint warnings
squiggle check model.squiggle --run         # ...and also evaluate to catch runtime errors
squiggle docs --list                        # builtin namespaces
squiggle docs Dist                          # functions in a namespace
squiggle docs Dist.normal [--json]          # signatures and examples for a function
squiggle docs lognorm                       # fuzzy search
```

All commands exit with code 1 on errors, including in `--json` mode. In JSON output, distributions are summarized as `{type: "Dist", subtype, mean, stdev, p5, p25, p50, p75, p95, min, max, sampleCount}` (add `--samples N` to include the first N raw samples); other non-primitive values are objects with a `type` field. The same conversion is available programmatically as `sqValueToJson(value)`.

# Build for development

We assume that you installed turborepo and ran `pnpm i`.

```sh
npx turbo build
```

Other:

```sh
pnpm dev  # listens to files and recompiles at every mutation
pnpm test

# where o := open in osx and o := xdg-open in linux,
pnpm coverage:local; o coverage/lcov-report/index.html  # produces coverage report and opens it in browser
```

# Distributing this package or using this package from other monorepo packages

As it says in the other `packages/*/README.md`s, building this package is an essential step of building other packages.

# Information

Squiggle is a language for representing probability distributions, as well as functions that return probability distributions. Its original intended use is for improving epistemics around EA decisions.

This package, `@quri/squiggle-lang`, contains the core language of squiggle. The main feature revolves around evaluating squiggle expressions. Currently the package only exports a single function, named "run", which from a squiggle string returns an object representing the result of the evaluation.

If using this package for tests or as a dependency, typescript typings are available and recommended to be used.
