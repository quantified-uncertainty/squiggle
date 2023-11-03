---
description: Squiggle lists are a lot like Python lists or Ruby arrays. They accept all types.
---

# List

Squiggle lists are a lot like Python lists or Ruby arrays. They accept all types.

```squiggle
myList = [3, normal(5, 2), "random"]
```

## List Creation

### make

```
List.make: (number, 'a) => list<'a>
List.make: (number, () => 'a) => list<'a>
List.make: (number, (index: number) => 'a) => list<'a>
```

Returns an array of size `n` filled with the value.

```squiggle
List.make(4, 1) // [1, 1, 1, 1]
List.make(3, {|index| index * 2}) // [2,4,6]
```

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#make)

### upTo

```
List.upTo: (low:number, high:number) => list<number>
```

```squiggle
List.upTo(0, 5) // [0, 1, 2, 3, 4, 5]
```

Syntax taken from [Ruby](https://apidock.com/ruby/v2_5_5/Integer/upto).


## List Querying and Reading 

### first

```
List.first: (list<'a>) => 'a
```

### last

```
List.last: (list<'a>) => 'a
```

### length

```
List.length: (list<'a>) => number
```

### find

Returns an error if there is no value found.
```
List.find: (list<'a>, ('a) => bool) => 'a
```

### findIndex

Returns `-1` if there is no value found.

```
List.findIndex: (list<'a>, 'a => bool) => number
```

### every

```
List.every: (list<'a>, 'a => bool) => list<'a>
```

### some

```
List.some: (list<'a>, 'a => bool) => list<'a>
```

## List Modification

Please note that methods in the standard library are immutable. They do not alter the input data; instead, they return a modified version.
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
List.reverse: (list<'a>) => list<'a>
```
### shuffle

```
List.shuffle: (list<'a>) => list<'a>
```

### zip

```
List.zip: (list<'a>, list<'b>) => list<['a,'b]>
```

### unzip

```
List.unzip: (list<['a,'b]>) => list<'a>, list<'b>
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

## List Filtering

### slice
```
List.slice: (list<'a>, minIndex: number) => list<'a>
List.slice: (list<'a>, minIndex: number, maxIndex: number) => list<'a>
```

Returns a copy of the list, between the selected ``start`` and ``end``, end not included. Directly uses the [Javascript implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) underneath.

```squiggle
List.slice([1,2,3,4,5,6], 2) // [3,4,5,6]
List.slice([1,2,3,4,5,6], 2, 4) // [3,4]
```


### filter

```
List.filter: (list<'a>, 'a => bool) => list<'a>
```

See [Rescript implementation of keep](https://rescript-lang.org/docs/manual/latest/api/belt/array#keep), which is functionally equivalent.

### uniq

Filters the list for unique elements. Now only works on some Squiggle types.

```
List.uniq: (list<'a>) => list<'a>
```

```squiggle
List.uniq(["foobar", "foobar", 1, 1, 2]) // ["foobar", 1, 2]
```

### uniqBy

Filters the list for unique elements. Now only works on some Squiggle types.

```
List.uniqBy: (list<'a>, 'a => 'b) => list<'a>
```

```squiggle
List.uniqBy([{a: 3, b: 10}, {a:3, b:40}, {a:5, b:20}], {|e| e.a}) // [{a: 3, b: 10}, {a:5, b:20}]
```

## Functional Transformations

### map

```
map: (list<'a>, 'a => 'b) => list<'b>
map: (list<'a>, ('a, index: number) => 'b) => list<'b>
```

```squiggle
map(["foo", "bar"], {|s| s + "!"})
map(["foo", "bar"], {|s, i| {word: s, index: i}})
```

See [Rescript implementation](https://rescript-lang.org/docs/manual/latest/api/belt/array#map).


### reduce

```
reduce: (list<'b>, 'a, ('a, 'b) => 'a) => 'a
reduce: (list<'b>, 'a, ('a, 'b, index: number) => 'a) => 'a
```

`reduce(arr, init, f)`

Applies `f` to each element of `arr`. The function `f` has two main paramaters, an accumulator and the next value from the array. It can also accept an optional third `index` parameter.

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
