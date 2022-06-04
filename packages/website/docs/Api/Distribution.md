---
sidebar_position: 2
title: Distribution
---


## mixture

**Definition**  
```javascript
mixture(...distributions, weights:list<float>):distribution
```

**Examples**
```javascript
mixture(normal(5,1), normal(10,1))
```

## sample
Get one random sample from the distribution

**Definition**  
```javascript
sample(distribution):number
```

**Examples**
```javascript
sample(normal(5,2))
```

## sampleN
Get n random samples from the distribution

**Definition**  
```javascript
sample(distribution, number):list<number>
```

**Examples**
```javascript
sample(normal(5,2), 100)
```

## mean
Get the distribution mean

**Definition**  
```javascript
mean(distribution):number
```

**Examples**
```javascript
mean(normal(5,2))
```

## cdf

**Definition**  
```javascript
cdf(distribution, number):number
```

**Examples**
```javascript
cdf(normal(5,2), 3)
```

## pdf

**Definition**  
```javascript
pdf(distribution, number):number
```

**Examples**
```javascript
pdf(normal(5,2), 3)
```

## inv

**Definition**  
```javascript
inv(distribution, number):number
```

**Examples**
```javascript
inv(normal(5,2), 0.5)
```

## toPointSet
Converts a distribution to the pointSet format

**Definition**  
```javascript
toPointSet(distribution):pointSetDistribution
```

**Examples**
```javascript
toPointSet(normal(5,2))
```

## toSampleSet
Converts a distribution to the sampleSet format, with n samples

**Definition**  
```javascript
toSampleSet(distribution,n):sampleSetDistribution
```

**Examples**
```javascript
toSampleSet(normal(5,2))
```

## truncateLeft
Truncates the left side of a distribution. Returns either a pointSet distribution or a symbolic distribution.

**Definition**  
```javascript
truncateLeft(distribution, l:number):distribution
```

**Examples**
```javascript
truncateLeft(normal(5,2), 3)
```

## truncateRight
Truncates the right side of a distribution. Returns either a pointSet distribution or a symbolic distribution.

**Definition**  
```javascript
truncateRight(distribution, r:number):distribution
```

**Examples**
```javascript
truncateLeft(normal(5,2), 6)
```

## klDivergence
Kullback–Leibler divergence between two distributions

**Definition**  
```javascript
klDivergence(distribution, distribution):number
```

**Examples**
```javascript
klDivergence(normal(5,2), normal(5,4)) // returns 0.57
```

## logScoreWithPointAnswer

**Definition**  
```javascript
logScoreWithPointAnswer(distribution, number):number
```

**Examples**
```javascript
logScoreWithPointAnswer(normal(5,2), 3) // returns 2.11
```

## toString

**Definition**  
```javascript
toString(distribution):string
```

**Examples**
```javascript
toString(normal(5,2))
```

## toSparkline
Produce a sparkline of length n

**Definition**  
```javascript
toSparkline(distribution, n=20):string
```

**Examples**
```javascript
toSparkline(normal(5,2), 10):string
```

## inspect
Prints the value of the distribution to the Javascript console, then returns the distribution.

**Definition**  
```javascript
inspect(distribution):distribution
```

**Examples**
```javascript
inspect(normal(5,2))
```

## normalize
Normalize a distribution. This means scaling it appropriately so that it's cumulative sum is equal to 1.

**Definition**  
```javascript
normalize(distribution):distribution
```

**Examples**
```javascript
normalize(normal(5,2))
```

## isNormalized
Check of a distribution is normalized. Most distributions are typically normalized, but there are some commands that could produce non-normalized distributions.

**Definition**  
```javascript
isNormalized(distribution):bool
```

**Examples**
```javascript
isNormalized(normal(5,2)) // returns true
```

## integralSum
Get the sum of the integral of a distribution. If the distribution is normalized, this will be 1.

**Definition**  
```javascript
integralSum(distribution):number
```

**Examples**
```javascript
integralSum(normal(5,2))
```

## log

**Definition**  
```javascript
log(distribution):distribution
```


## log10

**Definition**  
```javascript
log10(distribution):distribution
```


## unaryMinus

**Definition**  
```javascript
unaryMinus(distribution):distribution
```


## add

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## multiply

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## subtract

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## divide

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## pow

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotAdd

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotMultiply

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotSubtract

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotDivide

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotPow

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## dotExp

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## scaleLog

**Definition**  
```javascript
scaleLog(distribution): distribution
```


## scaleLog10

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## scaleLogWithThreshold

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## scalePow

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## scaleExp

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## toInternalSampleArray
Gets the internal samples of a sampleSet distribution. This is separate from the sampleN() function, which would shuffle the samples. toInternalSampleArray() maintains order and length.

**Definition**  
```javascript
toInternalSampleArray(sampleSetDist):list<number>
```

**Examples**
```javascript
toInternalSampleArray(toSampleSet(normal(5,2)))
```

## mapSamples

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## mapSamples2

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```


## mapSamples3

**Definition**  
```javascript
dotSubtract(distribution, distribution): distribution
```
