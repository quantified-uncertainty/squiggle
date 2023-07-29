---
description: Functions for working with strings in Squiggle
---

# String

Strings support all JSON escape sequences, with addition of escaped single-quotes (for single-quoted strings)

```js
a = "'\" NUL:\u0000"
b = '\'" NUL:\u0000'
```

### concat

```
concat: (string, string) => string
```

```squiggle
s1 = concat("foo", "bar") // foobar
s2 = "foo" + "bar" // foobar
s3 = "foo" + 3 // foo3
```
