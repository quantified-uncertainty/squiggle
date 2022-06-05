---
sidebar_position: 8
title: Sample Set Distribution
---

### toInternalSampleArray
Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toInternalSampleArray() maintains order and length.

```javascript
(sampleSet):list<number>
```

**Examples**
```javascript
toInternalSampleArray(toSampleSet(normal(5,2)))
```

### kde

```javascript
(sampleSet):pointSetDist
```


### toEmpiricalPdf

```javascript
(sampleSet):pointSetDist
```


### map

```javascript
(sampleSet, (r => number)): sampleSet
```


### map2

```javascript
(sampleSet, sampleSet, ((d1, d2)=>number)): sampleSet
```


### map3

```javascript
(sampleSet, sampleSet, sampleSet, ((d1, d2, d3)=>number)): sampleSet
```


### make

```javascript
(dist): sampleSet (()=>number): sampleSet (list<number>): sampleSet
```