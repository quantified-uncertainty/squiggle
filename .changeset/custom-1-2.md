---
"@quri/squiggle-lang": minor
---

Support for tags (`Tag.*` functions) and decorators (`@decoratorName`) that can be used to affect how the value is displayed.
Tags can be attached to any value, and decorators can be attached to any variable or function definition.
Decorators are proxied to Tag functions, e.g. `@name("X var") x = 5` is the same as `x = 5 -> Tag.name("X var")`.
Builtin tags: `@name`, `@description`, `@format`, `@showAs`, `@hide`.
