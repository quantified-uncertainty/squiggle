---
"@quri/prettier-plugin-squiggle": patch
"@quri/squiggle-lang": patch
---

Units are whitelisted and are represented in AST.

This allows us to:

- return compile-time errors on `123unknown`
- correctly format unit values in prettier plugin
