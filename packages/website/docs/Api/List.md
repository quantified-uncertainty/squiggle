---
sidebar_position: 4
title: List
---

### toString

```javascript
(list<'a>):string
```


### length

```javascript
(list<'a>):number
```


### get

```javascript
(list<a>, number):a
```


### find

```javascript
(list<a>, e => bool):a
```


### filter

```javascript
(list<a>, e => bool):a
```


### set

```javascript
(list<a>, number, a):a
```


### shuffle

```javascript
(list<a>):list<a>
```


### reverse

```javascript
(list<a>):list<a>
```


### make

```javascript
(number,a):list<a> (number, (index:number => a)):list<a> (pointSetDist):list<number>
```


### range

```javascript
(low:number, high:number) => list<number>
```


### rangeBy

```javascript
(low:number, high:number, increment: number) => list<number>
```


### zip

```javascript
(list<a>, list<b>):list<list<a|b>>
```


### unzip

```javascript
(list<list<a|b>>):list<list<a>, list<b>>
```


### concat

```javascript
(list<a>, list<b>): list<a|b>
```


### concatMany

```javascript
(list<list<a>>):list<a>
```


### slice

```javascript

```


### map

```javascript
(list<a>, (a -> b)): list<b>
```


### reduce

```javascript

```


### reduceRight

```javascript

```


### includes

```javascript
(list<'a>, 'a => bool):boolean
```


### every

```javascript
(list<'a>, 'a => bool):boolean
```


### truncate

```javascript
(list<'a>, number):list<'a>
```


### uniq

```javascript
(list<'a>):list
```


### first

```javascript
(list<'a>):'a
```


### last

```javascript
(list<'a>):'a
```


### sort

```javascript
(list<'a>):list
```