# Squiggle

[![Packages check](https://github.com/quantified-uncertainty/squiggle/actions/workflows/ci.yml/badge.svg)](https://github.com/quantified-uncertainty/squiggle/actions/workflows/ci.yml)
[![npm version - lang](https://badge.fury.io/js/@quri%2Fsquiggle-lang.svg)](https://www.npmjs.com/package/@quri/squiggle-lang)
[![npm version - components](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/develop/LICENSE)
[![codecov](https://codecov.io/gh/quantified-uncertainty/squiggle/branch/develop/graph/badge.svg?token=QRLBL5CQ7C)](https://codecov.io/gh/quantified-uncertainty/squiggle)

_An estimation language_.

## Get started

- [Gallery](https://www.squiggle-language.com/docs/Discussions/Gallery)
- [Squiggle playground](https://squiggle-language.com/playground)
- [Language basics](https://www.squiggle-language.com/docs/Guides/Language)
- [Squiggle functions source of truth](https://www.squiggle-language.com/docs/Guides/Functions)
- [Known bugs](https://www.squiggle-language.com/docs/Discussions/Bugs)
- [Original lesswrong sequence](https://www.lesswrong.com/s/rDe8QE5NvXcZYzgZ3)
- [Author your squiggle models as Observable notebooks](https://observablehq.com/@hazelfire/squiggle)
- [Use squiggle in VS Code](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle)

## Our deployments

- **website/docs prod**: https://squiggle-language.com
- **website/docs staging**: https://preview.squiggle-language.com
- **components storybook prod**: https://components.squiggle-language.com
- **components storybook staging**: https://preview-components.squiggle-language.com
- **legacy (2020) playground**: https://playground.squiggle-language.com

## Packages

This monorepo has several packages that can be used for various purposes. All
the packages can be found in `packages`.

- `@quri/squiggle-lang` in `packages/squiggle-lang` contains the core language, particularly
  an interface to parse squiggle expressions and return descriptions of distributions
  or results.
- `@quri/squiggle-components` in `packages/components` contains React components that
  can be passed squiggle strings as props, and return a presentation of the result
  of the calculation.
- `packages/website` is the main descriptive website for squiggle,
  it is hosted at `squiggle-language.com`.
- `packages/vscode-ext` is the VS Code extension for writing estimation functions.
- `packages/cli` is an experimental way of using imports in squiggle, which is also on [npm](https://www.npmjs.com/package/squiggle-cli-experimental).

# Develop

For any project in the repo, begin by running `yarn` in the top level

```sh
yarn
```

Then use `turbo` to build the specific packages or the entire monorepo:

```sh
turbo run build
```

Or:

```sh
turbo run build --filter=@quri/squiggle-components
```

You can also run specific npm scripts for the package you're working on. See `packages/*/README.md` for the details.

# NixOS users

This repository requires the use of bundled binaries from node_modules, which
are not linked statically. The easiest way to get them working is to enable
[nix-ld](https://github.com/Mic92/nix-ld).

# Contributing

See `CONTRIBUTING.md`.
