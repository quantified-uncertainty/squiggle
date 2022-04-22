---
title: Grammar
urlcolor: blue
author:
  - Quinn Dougherty
---

Formal grammar specification, reference material for parser implementation.

_In all likelihood the reference will have to be debugged as we see what tests pass and don't pass during implementation_.

## Lexical descriptions of constants and identifiers

- `<number>` ::= `[-]? [0-9]+ (.[0-9]+)? | [-]? [0-9]+ (.[0-9]+)? [e] [-]? [0-9]+`
- `<symbol>` ::= `[a-zA-Z]+ [a-zA-Z0-9]?`
- `<baseDistribution>` ::= `(normal(<number>, <number>) | beta(<number>, <number>) | triangular(<number>, <number>, <number>) | cauchy(<number>, <number>) | lognormal(<number>, <number>)) | uniform(<number>, <number>) | <number> to <number> | exponential(<number>)`

## Expressions

Think of javascript's list unpacking notation to read our variable-argument function `mixture`.

```
<expr> ::= <term> + <expr> | <term> - <expr> | <expr> .+ <expr> | <expr> .- <expr> | <term> | sample(<baseDistribution>) | mixture(...<array>, <array>) | mx(...<array>, <array>) | exp(<expr>) | log(<expr>, <number>?) | log10(<expr>) | dotLog(<expr>, <number>?) | normalize(<expr>)
<term> ::= <power> * <term> | <power> <term> | <power> / <term> | <power> .* <term> | <power ./ <term> | <power>
<power> ::= <factor> ^ <power> | <factor> .^ <power> | <factor>
<factor> ::= <number> | <baseDistribution> | <symbol> | ( <expr> )
```

## Data structures

```
<array> ::= [] | [<expr>] | [<expr>, <expr>] | ...
<record> ::= {} | {<symbol>: <expr>} | {<symbol>: <expr>, <symbol>: <expr>} | ...
```

## Statements

```
<stmnt> ::= <asgn> | <asgnFn>
<asgn> ::= <symbol> = <expr>
<asgnFn> ::= <symbol>(<symbol>) = <expr>
```

## A squiggle file

To be valid and raise no errors as of current (apr22) interpreter,

```
<delim> ::= ; | \n
<code> ::= <expr> | <stmnt> <delim> <expr> | <stmnt> <delim> <stmnt> <delim> <expr> | ...
```

This isn't strictly speaking true; the interpreter allows expressions outside of the final line.
