---
sidebar_position: 11
title: String
---

Strings support all JSON escape sequences, with addition of escaped single-quotes (for single-quoted strings)

```js
a = "'\" NUL:\u0000"
b = '\'" NUL:\u0000'
```

### concat

```
concat: (string, string) => string
```

```js
concat("foo", "bar"); // foobar
"foo" + "bar"; // foobar
"foo" + 3; // foo3
```
