---
description: Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.
---

# Dictionary

Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.

Dictionaries are ordered. Duplicates are not allowed. They are immutable, like all types in Squiggle.

**Example**

```squiggle
table = 10 to 30
chair = 0.01 to 0.5

valueFromOfficeItems = {
  keyboard: 1,
  headphones: "ToDo",
  chair, table
}

valueFromHomeItems = {
  monitor: 1,
  bed: 0.2 to 0.6,
  lights: 0.02 to 0.2,
  coffee: 5 to 20,
  chair, table
}

homeToItemsConversion = 0.1 to 0.4

conversionFn(i) = [i[0], i[1] * homeToItemsConversion]
updatedValueFromHomeItems = valueFromHomeItems -> Dict.toList -> map(conversionFn) -> Dict.fromList

allItems = Dict.merge(valueFromOfficeItems, updatedValueFromHomeItems)
```

### toList

```
Dict.toList: (dict<'a>) => list<list<string|a>>
```

```squiggle
Dict.toList({ foo: 3, bar: 20 }) // [["foo", 3], ["bar", 20]]
```

### fromList

```
Dict.fromList: (list<list<string|'a>>) => dict<'a>
```

```squiggle
Dict.fromList([
  ["foo", 3],
  ["bar", 20],
]) // {foo: 3, bar: 20}
```

### keys

```
Dict.keys: (dict<'a>) => list<string>
```

```squiggle
Dict.keys({ foo: 3, bar: 20 }) // ["foo", "bar"]
```

### values

```
Dict.values: (dict<'a>) => list<'a>
```

```squiggle
Dict.values({ foo: 3, bar: 20 }) // [3, 20]
```

### merge

```
Dict.merge: (dict<'a>, dict<'b>) => dict<'a|b>
```

```squiggle
first = { a: 1, b: 2 };
snd = { b: 3, c: 5 };
Dict.merge(first, snd); // {a: 1, b: 3, c: 5}
```

### mergeMany

```
Dict.mergeMany: (list<dict<'a>>) => dict<'a>
```

```squiggle
first = { a: 1, b: 2 }
snd = { b: 3, c: 5 }
Dict.mergeMany([first, snd]) // {a: 1, b: 3, c: 5}
```

### set

```
Dict.set: (dict<'a>, string, 'a) => dict<'a>
```

Creates a new dictionary that includes the added element, while leaving the original dictionary unaltered.

### map

```
Dict.map: (dict<'a>, (`a => `a)) => dict<'a>
```

```squiggle
Dict.map({a: 1, b: 2}, {|x| x + 1}) // { a: 2, b:3 }
```

### mapKeys

```
Dict.map: (dict<'a>, (string => string)) => dict<'a>
```

```squiggle
Dict.mapKeys({a: 1, b: 2}, {|x| x + "hi" }) // {ahi: 1, bhi: 2}
```

### pick

```
Dict.pick: (dict<'a>, list<string>) => dict<'a>
```

Selects only the keys from the dictionary that are specified in the list, and returns a new dictionary with those keys.

```squiggle
data = { a: 1, b: 2, c: 3, d: 4 }
Dict.pick(data, ["a", "c"]) // {a: 1, c: 3}
```

### omit

```
Dict.omit: (dict<'a>, list<string>) => dict<'a>
```

Removes the keys from the dictionary that are specified in the list, and returns a new dictionary without those keys.

```squiggle
data = { a: 1, b: 2, c: 3, d: 4 }
Dict.omit(data, ["b", "d"]) // {a: 1, c: 3}
```