---
sidebar_position: 2
title: Dictionary
---

### toList

```
Dict.toList: (dict<'a>) => list<list<string|a>>
```

```js
Dict.toList({ foo: 3, bar: 20 }); // [["foo", 3], ["bar", 20]]
```

### fromList

```
Dict.fromList: (list<list<string|'a>>) => dict<'a>
```

```js
Dict.fromList([
  ["foo", 3],
  ["bar", 20],
]); // {foo: 3, bar: 20}
```

### keys

```
Dict.keys: (dict<'a>) => list<string>
```

```js
Dict.keys({ foo: 3, bar: 20 }); // ["foo", "bar"]
```

### values

```
Dict.values: (dict<'a>) => list<'a>
```

```js
Dict.values({ foo: 3, bar: 20 }); // [3, 20]
```

### merge

```
Dict.merge: (dict<'a>, dict<'b>) => dict<'a|b>
```

```js
first = { a: 1, b: 2 };
snd = { b: 3, c: 5 };
Dict.merge(first, snd); // {a: 1, b: 3, c: 5}
```

### mergeMany

```
Dict.mergeMany: (list<dict<'a>>) => dict<'a>
```

```js
first = { a: 1, b: 2 };
snd = { b: 3, c: 5 };
Dict.mergeMany([first, snd]); // {a: 1, b: 3, c: 5}
```
