---
sidebar_position: 4
title: Sample Set Distribution
---

### make
```
SampleSet.make: (distribution) => sampleSet
SampleSet.make: (() => number) => sampleSet
SampleSet.make: (list<number>) => sampleSet
```



### kde
```
SampleSet.kde: (sampleSet) => pointSetDist
```



### toEmpiricalPdf
```
SampleSet.toEmpiricalPdf: (sampleSet) => pointSetDist
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



### correlation
```
SampleSet.correlation: (sampleSet, sampleSet) => number
```



### toInternalSampleArray
```
SampleSet.toInternalSampleArray: (sampleSet) => list<number>
```
Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toInternalSampleArray() maintains order and length.Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toInternalSampleArray() maintains order and length.


**Examples**
```
toInternalSampleArray(toSampleSet(normal(5,2)))
```