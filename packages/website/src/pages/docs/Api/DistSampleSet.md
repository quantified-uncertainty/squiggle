---
description: Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers.
---

# Sample Set Distribution

Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers. It's useful to distinguish point set distributions from arbitrary lists of numbers to make it clear which functions are applicable.

Monte Carlo calculations typically result in sample set distributions.

All regular distribution function work on sample set distributions. In addition, there are several functions that only work on sample set distributions.

### make

Calls the correct conversion constructor, based on the corresponding input type, to create a Sample Set distribution. 

```
SampleSet.make: (distribution|list<number>) => pointSetDist
SampleSet.make: (() => number) => pointSetDist
SampleSet.make: ((index: number) => number) => pointSetDist
```

### fromDist

```
SampleSet.fromDist: (distribution) => sampleSet
```

### fromNumber

```
SampleSet.fromNumber: (number) => sampleSet
```

### fromList

```
SampleSet.fromList: (list<number>) => sampleSet
```

### fromFn

```
SampleSet.fromFn: ((float) => number) => sampleSet
```

```
PointSet.fromNumber: (number) => sampleSet
```

### toList

```
SampleSet.toList: (sampleSet) => list<number>
```

Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toList() maintains order and length.

**Examples**

```
toList(SampleSet.fromDist(normal(5,2)))
```

### map

```
SampleSet.map: (sampleSet, (number => number)) => sampleSet
```

### map2

```
SampleSet.map2: (sampleSet, sampleSet, ((number, number) => number)) => sampleSet
```

### map3

```
SampleSet.map3: (sampleSet, sampleSet, sampleSet, ((number, number, number) => number)) => sampleSet
```

### mapN

```
SampleSet.mapN: (list<sampleSet>, (list<sampleSet> => number)) => sampleSet
```
