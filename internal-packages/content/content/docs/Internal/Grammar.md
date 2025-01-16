---
---

## Peggy grammar
The source of truth for Squiggle's syntax is [Peggy](https://peggyjs.org) grammar, defined in [this file](https://github.com/quantified-uncertainty/squiggle/blob/main/packages/squiggle-lang/src/ast/peggyParser.peggy).

The grammar is used to generate Squiggle's parser, which is used to parse Squiggle code into an abstract syntax tree (AST).

### Bugs

Open bugs and feature requests for the grammar are tracked in [GitHub issues](https://github.com/quantified-uncertainty/squiggle/labels/Parser).

## Lezer grammar

In Squiggle editor, we use [Lezer](https://lezer.codemirror.net/) to highlight Squiggle code.

Lezer grammar is defined in [this file](https://github.com/quantified-uncertainty/squiggle/blob/main/packages/components/src/components/CodeEditor/languageSupport/squiggle.grammar).

Lezer grammar is **not** authoritative for Squiggle syntax. It tries to replicate the syntax of the Peggy grammar, but Peggy grammar contains a few ambiguities that are hard to replicate in Lezer.
