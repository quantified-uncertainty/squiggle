# Contributing to Squiggle

We welcome contributions from developers, especially people in React/TypeScript, and interpreters/parsers. We also are keen to hear issues filed by users!

Squiggle is currently in "Early Access" mode.

# Quick links

- [Squiggle documentation](https://www.squiggle-language.com/docs/Overview)
- The team presently communicates via the **EA Forecasting and Epistemics** slack (channels `#squiggle-dev` and `#squiggle-ops`). You can track down an invite by reaching out to Ozzie Gooen
- You can email `slava@quantifieduncertainty.org` if you need assistance in onboarding or if you have questions

# Bug reports

Anyone (with a GitHub account) can file an issue at any time. Please allow [Slava](https://github.com/berekuk) and [Ozzie](https://github.com/OAGr) to triage, but otherwise just follow the suggestions in the issue templates.

# Project structure

Squiggle is a **monorepo** with several **packages**.

- **components** is where we improve reactive interfacing with Squiggle
- **squiggle-lang** is where the magic happens: probability distributions, the interpreter, etc.
- **website** is the site [squiggle-language.com](https://www.squiggle-language.com)
- **vscode-ext** is the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=qURI.vscode-squiggle)

# VS Code

If you want to use [VS Code Jest extension](https://github.com/jest-community/vscode-jest), or share other useful workspace settings, such as multi-root mode, move `.vscode/squiggle.code-workspace.default` file to `.vscode/squiggle.code-workspace`.

# Deployment ops

We use Vercel, and it should only concern Slava and Ozzie.

# Development environment, building, testing, dev server

You'll need [pnpm](https://pnpm.io/).

Being a monorepo, where packages are connected by dependency, it's important to follow `README.md`s closely. Each package has its own `README.md`, which is where the bulk of information is.

We aspire for `ci.yaml` and `README.md`s to be in one-to-one correspondence.

# Try not to push directly to `main`

If you absolutely must, please prefix your commit message with `hotfix: `.

# Pull request protocol

Please work against `main` branch.

For PRs from the core contributor team, we usually wait for at least one review unless the PR is trivial or urgent.

Autopings are set up: if you are not autopinged, you are welcome to comment, but please do not use the formal review feature, send approvals, rejections, or merges.

# Code Quality

- Aim for at least 8/10\* quality in `/packages/squiggle-lang`, and 7/10 quality in `/packages/components`.
- If you submit a PR that is under a 7, for some reason, describe the reasoning for this in the PR.

* This quality score is subjective.

# TypeScript style

**Prefer `const` over `let`, never use `var`**

`var` is deprecated in JS. `let` should only be used for mutable variables.

**Use functional style, avoid classes**

We use classes for outer-facing APIs, but most of the codebase should use plain immutable objects with functions act on those objects.

**Use immutable types when it doesn't hurt the performance**

Wrap object types in [Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype) or mark individual fields as `readonly`.

**Don't use namespaces**

Use native ES modules instead, as [recommended by TypeScript documentation](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html#using-modules).

**Avoid `any` as much as possible**

It's almost always possible to type things properly with modern Typescript.

**Always use `===` instead of `==`**

Loose equality is [crazy](https://dorey.github.io/JavaScript-Equality-Table/unified/).

**Don't use too many external libraries**

This is especially important in `squiggle-lang` and less important in `website` or some other code that won't be used much as a library by many users.

Heuristics for deciding whether pulling an external library is worth it:

- is it maintained? is it going to stay maintained in the future?
- how hard it would be to reimplement the functionality ourselves? if it's a few lines, it's better to control the implementation in our own codebase
- what's the bundle size of the dependency and would it be effectively tree-shaked, if the dependency is big and we need only a small part of it?
- would we want to fine-tune the implementation in the future, because of Squiggle's design needs or for the sake of performance?
  - the closer to the "core" functionality of Squiggle the feature is (math, distributions-related code), the more it makes sense to keep control over the implementation details

**Prefer named exports over default exports**

It's easier to do refactorings with named exports.

**Name files according to their main named exports; split code into many small files**

This is expecially straightforward in the frontend code; try to put one component in a single file, `export const MyComponent: FC = ...` from `MyComponent.tsx`.

In the squiggle-lang code, I'm not sure yet if this is viable.

**Prefer `type` over `interface`**

In the modern TypeScript there's no [big](https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript/52682220) [difference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces) between types and interfaces. Errors in interfaces can be slightly nicer, but interfaces are open by default and we mostly don't want that.

It's not worth fighting over, though, the difference is pretty small.

**Prefer `function` keyword over arrow functions in top scope, use arrow functions otherwise**

Exceptions:

- For React components, it's better to use `const my Component: FC<...> = ` since it type-checks both the arguments and the result type.
- In some other cases where you have several functions with the similar signature, it's also convenient to define a type for the entire function, and you have to use arrow functions to use it.

Also, don't use `function` keyword in non-top scopes (it's easier to avoid hoisting quirks this way).

**Prefer `undefined` over `null`**

**Use `UpperCamelCase` for type names, `camelCase` for variable names**

**Use exceptions instead of Ok/Error pairs, wrap in try/catch on top level if necessary**

**https://github.com/airbnb/javascript is mostly good**

When it doesn't contradict the list above.
