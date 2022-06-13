---
sidebar_position: 2
title: Dictionary
---

Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.

Dictionaries are unordered and duplicates are not allowed. They are meant to be immutable, like most types in Squiggle.

**Example**

```javascript
valueFromOfficeItems = {
  keyboard: 1,
  chair: 0.01 to 0.5,
  headphones: "ToDo"
}

valueFromHomeItems = {
  monitor: 1,
  bed: 0.2 to 0.6,
  lights: 0.02 to 0.2,
  coffee: 5 to 20
}

homeToItemsConversion = 0.1 to 0.4

conversionFn(i) = [i[0], i[1] * homeToItemsConversion]
updatedValueFromHomeItems = valueFromHomeItems |> Dict.toList |> map(conversionFn) |> Dict.fromList

allItems = merge(valueFromOfficeItems, updatedValueFromHomeItems)
```

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
