---
sidebar_position: 11
title: Flow
---

This page documents parts of the squiggle language that aren't related to distributions, but rather to flow structures. For now, it only deals with if/else constructs, and points to the reader to reduce/map constructs instead of for loops

## If-else

### If-else as a flow structure

```js
if condition then result else alternative
```

```js
if x == 1 then 1 else 2
```

### If-else as ternary operation

```js
test ? result : alternative
```

```js
x == 0 ? 1 : 2
```

### Tips and tricks

#### Use brackets and parenthesis to simplify flow

```js
if x == 1 then {
  1
} else {
  2
}
```

or

```js
if x == 1 then {
  (
    if y == 0 then {
      1
    } else {
      2
    }
  )
} else {
  3
}
```

#### Save the result to a variable

Assigning a value inside an if/else flow isn't possible:

```js

if x == 1 then {
  y = 1
} else {
  y = 2 * x
}

```

Instead, you can do this:

```js
y = if x == 1 then {
  1
} else {
  2*x
}
```

Likewise, for assigning more than one value, you can't do this:

```js
y = 0
z = 0 
if x == 1 then {
  y = 2
} else {
  z = 4
}
```

Instead, do:

```js

result = if x == 1 then {
  {y: 2, z: 0}
} else {
  {y: 0, z: 4}
}
y = result.y
z = result.z
```


## For loops

For loops currently don't exist in Squiggle. instead, use a [map](https://www.squiggle-language.com/docs/Api/List#map) or a [reduce](https://www.squiggle-language.com/docs/Api/List#reduce) operator:


Instead of:

```js
xs = []
for(i = 0; i < 10; i++){
  xs[i] = f(x)
}
```

do:

```js
ls = List.upTo(0,10)
xs = List.map(l, {|l| f(l)})
```
