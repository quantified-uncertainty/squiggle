---
sidebar_position: 1
title: Dictionary
---

### toString
```
toString: (dict<'a>) => string
```



### get
```
Dict.get: (dict<'a>, string) => a
```



### set
```
Dict.set: (dict<'a>, string, a) => a
```



### toPairs
```
Dict.toPairs: (dict<'a>) => list<list<string|a>>
```



### keys
```
Dict.keys: (dict<'a>) => list<string>
```



### values
```
Dict.values: (dict<'a>) => list<'a>
```



### merge
```
Dict.merge: (dict<'a>, dict<'b>) => dict<'a|b>
```



### mergeMany
```
Dict.mergeMany: (list<dict<'a>>) => dict<'a>
```