---
description: Functions for working with strings in Squiggle
---

# String

Strings support all JSON escape sequences, with addition of escaped single-quotes (for single-quoted strings)

```js
a = "'\" NUL:\u0000"
b = '\'" NUL:\u0000'
```

### make

Converts any type to a simple string. Note that information is typically lost in this process.

```
make: (any) => string
```

```squiggle
String.make(5 to 40)
String.make([3,4,5,2])
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

### split 

```
split: (string, string) => list<string>
```

```squiggle
foo = "this_is_a_sentence"
bar = String.split(foo, "_")
```