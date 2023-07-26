---
description: Squiggle lists are a lot like Python lists or Ruby arrays. They accept all types.
---

# List

Squiggle lists are a lot like Python lists or Ruby arrays. They accept all types.

```squiggle
myList = [3, normal(5, 2), "random"]
```

### make

```
List.make: (number, 'a) => list<'a>
```

Returns an array of size `n` filled with the value.

```squiggle
List.make(4, 1) // creates the list [1, 1, 1, 1]
```

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#make)

### toString

```
toString: (list<'a>) => string
```

### length

```
length: (list<'a>) => number
```

### upTo

```
List.upTo: (low:number, high:number) => list<number>
```

```squiggle
List.upTo(0, 5) // creates the list [0, 1, 2, 3, 4, 5]
```

Syntax taken from [Ruby](https://apidock.com/ruby/v2_5_5/Integer/upto).

### first

```
first: (list<'a>) => 'a
```

### last

```
last: (list<'a>) => 'a
```

### concat

```
List.concat: (list<'a>, list<'a>) => list<'a>
```

### append

```
List.append: (list<'a>, <'a>) => list<'a>
```

### reverse

```
reverse: (list<'a>) => list<'a>
```

### uniq

Filters the list for unique elements. Now only works on Strings, Numbers, and Booleans.

```
List.uniq: (list<'a>) => list<'a>
```

```squiggle
List.uniq(["foobar", "foobar", 1, 1, 2]) // ["foobar", 1, 2]
```

### map

```
map: (list<'a>, a => b) => list<'b>
map: (list<'a>, (a, number) => b) => list<'b>
```

```squiggle
map(["foo", "bar"], {|s| s + "!"})
map(["foo", "bar"], {|s, i| {word: s, index: i}})
```

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#map).

### filter

```

filter: (list<'a>, 'a => bool) => list<'a>

```

See [Rescript implementation of keep](https://rescript-lang.org/docs/manual/latest/api/belt/array#keep), which is functionally equivalent.

### reduce

```

reduce: (list<'b>, 'a, ('a, 'b) => 'a) => 'a

```

`reduce(arr, init, f)`

Applies `f` to each element of `arr`. The function `f` has two paramaters, an accumulator and the next value from the array.

```squiggle
reduce([2, 3, 4], 1, {|acc, value| acc + value}) == 10
```

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#reduce).

### reduce reverse

```
reduceReverse: (list<'b>, 'a, ('a, 'b) => 'a) => 'a
```

Works like `reduce`, but the function is applied to each item from the last back to the first.

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#reducereverse).

### reduceWhile

```
List.reduceWhile: (list<'b>, 'a, ('a, 'b) => 'a, ('a) => bool) => 'a
```

Works like `reduce`, but stops when the accumulator doesn't satisfy the condition, and returns the last accumulator that satisfies the condition (or the initial value if even the initial value doesn't satisfy the condition).

This is useful for simulating processes that need to stop based on the process state.

Example:

```js
/** Adds first two elements, returns `11`. */
List.reduceWhile([5, 6, 7], 0, {|acc, curr| acc + curr}, {|acc| acc < 15})

/** Adds first two elements, returns `{ x: 11 }`. */
List.reduceWhile([5, 6, 7], { x: 0 }, {|acc, curr| { x: acc.x + curr }}, {|acc| acc.x < 15})
```

### join

```
List.join: (list<string>, string) => string
```

```squiggle
List.join(["foo", "bar", "char"], "--") // "foo--bar--char"
```

### flatten

```
flatten: (list<list>) => list
```

```squiggle
List.flatten([
  [1, 2],
  [3, 4],
]) // [1,2,3,4]
```
