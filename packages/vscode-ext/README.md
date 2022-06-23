# Squiggle For VS Code

_[marketplace](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle)_

This extension provides support for [Squiggle](https://www.squiggle-language.com/) in VS Code.

Features:

- Preview `.squiggle` files in a preview pane
- Syntax highlighting for `.squiggle` and `.squiggleU` files

# Configuration

Some preview settings, e.g. whether to show the summary table or types of outputs, can be configurable on in the VS Code settings and persist between different preview sessions.

Check out the full list of Squiggle settings in the main VS Code settings.

# Build locally

We assume you ran `yarn` at the monorepo level for all dependencies.

Then, simply `yarn compile` at the `vscode-ext` package level. It will build `squiggle-lang`, `squiggle-components`, and the VS Code extension source code.
