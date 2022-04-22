---
title: Grammar
author:
  - Quinn Dougherty
---

Formal grammar specification, reference material for parser implementation.

_In all likelihood the reference will have to be debugged as we see what tests pass and don't pass during implementation_.

## Lexical descriptions of constants and identifiers

```
<number> ::= [-]? [0-9]+ (.[0-9]+)? | [-]? [0-9]+ (.[0-9]+)? [e] [-]? [0-9]+
<symbol> ::= [a-zA-Z]+ [a-zA-Z0-9]?
<bool> ::= true | false
```

## Expressions

The following gives no typing information. You can obey the grammar and still write nonsensical code.

Think of javascript's list unpacking notation to read our variable-argument function `mixture`.

```
<expr> ::= <term> + <expr> | <term> - <expr> | <expr> .+ <expr> | <expr> .- <expr> | <term>
<term> ::= <power> * <term> | <power> <term> | <power> / <term> | <power> .* <term> | <power ./ <term> | <power>
<power> ::= <factor> ^ <power> | <factor> .^ <power> | <factor>
<factor> ::= <number> | <bool> | <symbol> | ( <expr> ) | <symbol>(<symbol>)
```

## Data structures

```
<array> ::= [] | [<expr>] | [<expr>, <expr>] | ...
<record> ::= {} | {<symbol>: <expr>} | {<symbol>: <expr>, <symbol>: <expr>} | ...
```

## Statements

```
<statement> ::= <assign> | <assignFunction>
<assign> ::= <symbol> = <expr>
<assignFunction> ::= <symbol>(<symbol>) = <expr>
```

## A squiggle file

To be valid and raise no errors as of current (apr22) interpreter,

```
<delim> ::= ; | \n
<code> ::= <expr> | <statement> <delim> <expr> | <statement> <delim> <statement> <delim> <expr> | ...
```

This isn't strictly speaking true; the interpreter allows expressions outside of the final line.
