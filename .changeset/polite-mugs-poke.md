---
"@quri/squiggle-components": patch
"@quri/prettier-plugin-squiggle": patch
---

Autocompletion improvements:
- suggest local function names
- suggest parameter names
- don't suggest unreachable vars (declared below or in unreachable local scopes)
- different icon for local functions

Editor grammar improvements:
- functions with 0 parameters don't break the parser
- trailing expressions are now really optional (they weren't, but Lezer recovered from it so it didn't matter)

Fixed types in prettier-plugin-squiggle for standalone.js.
