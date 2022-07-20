---
sidebar_position: 5
title: Sample Set Distribution
---

:::danger
These functions aren't yet implemented with these specific names. This should be added soon.
:::

Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers. It's useful to distinguish point set distributions from arbitrary lists of numbers to make it clear which functions are applicable.

Monte Carlo calculations typically result in sample set distributions.

All regular distribution function work on sample set distributions. In addition, there are several functions that only work on sample set distributions.

### fromDist
```
Sampleset.fromDist: (list<number>) => sampleSet
```

### fromList
```
Sampleset.fromList: (list<number>) => sampleSet
```

### fromFn  

(Not yet implemented)
```
Sampleset.fromFn: (() => number) => sampleSet
```

### toList

```
Sampleset.toList: (sampleSet) => list<number>
```

Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toList() maintains order and length.

**Examples**

```
toList(toSampleSet(normal(5,2)))
```

### map

```
Sampleset.map: (sampleSet, (number => number)) => sampleSet
```

### map2

```
Sampleset.map2: (sampleSet, sampleSet, ((number, number) => number)) => sampleSet
```

### map3

```
Sampleset.map3: (sampleSet, sampleSet, sampleSet, ((number, number, number) => number)) => sampleSet
```
