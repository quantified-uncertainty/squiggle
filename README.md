# Squiggle

[![Packages check](https://github.com/quantified-uncertainty/squiggle/actions/workflows/ci.yml/badge.svg)](https://github.com/quantified-uncertainty/squiggle/actions/workflows/ci.yml)
[![npm version - lang](https://badge.fury.io/js/@quri%2Fsquiggle-lang.svg)](https://www.npmjs.com/package/@quri/squiggle-lang)
[![npm version - components](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/main/LICENSE)
[![codecov](https://codecov.io/gh/quantified-uncertainty/squiggle/branch/main/graph/badge.svg?token=QRLBL5CQ7C)](https://codecov.io/gh/quantified-uncertainty/squiggle)

A simple programming language for probabilistic estimation that runs on Javascript.

## Get started

- [Gallery](https://www.squiggle-language.com/docs/Ecosystem/Gallery)
- [Squiggle Playground](https://squiggle-language.com/playground)
- [Language basics](https://www.squiggle-language.com/docs/Guides/LanguageFeatures)
- [Known bugs](https://www.squiggle-language.com/docs/Guides/Bugs)
- [Original Lesswrong sequence](https://www.lesswrong.com/s/rDe8QE5NvXcZYzgZ3)
- [Author your Squiggle models as Observable notebooks](https://observablehq.com/@hazelfire/squiggle)
- [Use Squiggle in VS Code](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle)

## Our deployments

- **Language documentation**: https://squiggle-language.com
- **React components storybook**: https://components.squiggle-language.com
- **Squiggle Hub**: https://squigglehub.org

## Packages

This monorepo has several packages that can be used for various purposes. All
the packages can be found in `packages`.

- `@quri/squiggle-lang` in `packages/squiggle-lang` contains the core language, particularly
  an interface to parse Squiggle expressions and return descriptions of distributions
  or results.
- `@quri/squiggle-ui` in `packages/ui` has React components for common QURI projects.
- `@quri/squiggle-components` in `packages/components` contains React components particularly meant to be used with Squiggle visualizations.
- `packages/website` is the main documentation website for Squiggle. It is hosted at `squiggle-language.com`.
- `packages/hub` is the code behind [Squiggle Hub](https://squigglehub.org).
- `packages/vscode-ext` is the VS Code extension for writing estimation functions.
- `packages/cli` is an experimental way of using imports in Squiggle, which is also on [npm](https://www.npmjs.com/package/squiggle-cli-experimental).

# Develop

For any project in the repo, begin by running `pnpm install` in the top level:

```sh
pnpm i
```

Then use `turbo` to build the specific packages or the entire monorepo:

```sh
turbo run build
```

Or:

```sh
cd packages/components
turbo run build
```

You can also run specific npm scripts for the package you're working on. See `packages/*/README.md` for the details.

# Contributing

See `CONTRIBUTING.md`.
