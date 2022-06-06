---
sidebar_position: 6
title: List
---

## make
```
List.make: (number, 'a) => list<'a>
List.make: (number, number => a) => list<'a>
List.make: (pointSetDist) => list<number>
```



### toString
```
List.toString: (list<'a>) => string
```



### length
```
List.length: (list<'a>) => number
```



### get
```
List.get: (list<'a>, number) => 'a
```



### find
```
List.find: (list<'a>, 'a => bool) => 'a
```



### filter
```
List.filter: (list<'a>, 'a => bool) => 'a
```



### set
```
List.set: (list<'a>, number, 'a) => 'a
```



### shuffle
```
List.shuffle: (list<'a>) => list<'a>
```



### reverse
```
List.reverse: (list<'a>) => list<'a>
```



### range
```
List.range: (low:number, high:number, increment?:number=1.0) => list<number>
```



### zip
```
List.zip: (list<'a>, list<'b>) => list<list<'a|b>>
```



### unzip
```
List.unzip: (list<list<'a|b>>) => list<list<'a>, list<'b>>
```



### concat
```
List.concat: (list<'a>, list<'b>) => list<'a|b>
```



### concatMany
```
List.concatMany: (list<list<'a>>) => list<'a>
```



### slice
```
List.slice: 
```



### map
```
List.map: (list<'a>, a => b) => list<'b>
```



### reduce
```
List.reduce: 
```



### reduceRight
```
List.reduceRight: 
```



### includes
```
List.includes: (list<'a>, 'a => bool) => boolean
```



### every
```
List.every: (list<'a>, 'a => bool) => boolean
```



### truncate
```
List.truncate: (list<'a>, number) => list<'a>
```



### uniq
```
List.uniq: (list<'a>) => list<'a>
```



### first
```
List.first: (list<'a>) => 'a
```



### last
```
List.last: (list<'a>) => 'a
```



### sort
```
List.sort: (list<'a>) => list<'a>
```