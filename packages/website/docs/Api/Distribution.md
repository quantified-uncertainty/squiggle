---
sidebar_position: 2
title: Distribution
---
## Main

### mixture

```javascript
(...distributionLike, weights:list<float>):distribution
```

**Examples**
```javascript
mixture(normal(5,1), normal(10,1)) 
```

### sample
Get one random sample from the distribution

```javascript
(distribution):number
```

**Examples**
```javascript
sample(normal(5,2))
```

### sampleN
Get n random samples from the distribution

```javascript
(distribution, number):list<number>
```

**Examples**
```javascript
sample(normal(5,2), 100)
```

### mean
Get the distribution mean

```javascript
(distribution):number
```

**Examples**
```javascript
mean(normal(5,2))
```

### stdev

```javascript
(distribution):number
```


### variance

```javascript
(distribution):number
```


### mode

```javascript
(distribution):number
```


### cdf

```javascript
(distribution, number):number
```

**Examples**
```javascript
cdf(normal(5,2), 3)
```

### pdf

```javascript
(distribution, number):number
```

**Examples**
```javascript
pdf(normal(5,2), 3)
```

### pmf

```javascript
(distribution, number):number
```

**Examples**
```javascript
pmf(bernoulli(0.3), 0) // 0.7
```

### inv

```javascript
(distribution, number):number
```

**Examples**
```javascript
inv(normal(5,2), 0.5)
```

### toPointSet
Converts a distribution to the pointSet format

```javascript
(distribution):pointSetDistribution
```

**Examples**
```javascript
toPointSet(normal(5,2))
```

### toSampleSet
Converts a distribution to the sampleSet format, with n samples

```javascript
(distribution,n):sampleSetribution
```

**Examples**
```javascript
toSampleSet(normal(5,2))
```

### truncateLeft
Truncates the left side of a distribution. Returns either a pointSet distribution or a symbolic distribution.

```javascript
(distribution, l:number, {normalize: boolean=true}):distribution
```

**Examples**
```javascript
truncateLeft(normal(5,2), 3)
```

### truncateRight
Truncates the right side of a distribution. Returns either a pointSet distribution or a symbolic distribution.

```javascript
(distribution, r:number, {normalize: boolean=true}):distribution
```

**Examples**
```javascript
truncateLeft(normal(5,2), 6)
```

### klDivergence
Kullback–Leibler divergence between two distributions

```javascript
(distribution, distribution):number
```

**Examples**
```javascript
klDivergence(normal(5,2), normal(5,4)) // returns 0.57
```

### logScore

```javascript
({estimate: distribution, prior?: distribution, answer: distribution|number}):number
```

**Examples**
```javascript
logScore({estimate: normal(5,2), prior: normal(5.5,4), answer: 2.3})
```

### toString

```javascript
(distribution):string
```

**Examples**
```javascript
toString(normal(5,2))
```

### toSparkline
Produce a sparkline of length n

```javascript
(distribution, n=20):string
```

**Examples**
```javascript
toSparkline(normal(5,2), 10)
```

### inspect
Prints the value of the distribution to the Javascript console, then returns the distribution.

```javascript
(distribution):distribution
```

**Examples**
```javascript
inspect(normal(5,2))
```

### normalize
Normalize a distribution. This means scaling it appropriately so that it's cumulative sum is equal to 1.

```javascript
(distribution):distribution
```

**Examples**
```javascript
normalize(normal(5,2))
```

### isNormalized
Check of a distribution is normalized. Most distributions are typically normalized, but there are some commands that could produce non-normalized distributions.

```javascript
(distribution):bool
```

**Examples**
```javascript
isNormalized(normal(5,2)) // returns true
```

### integralSum
Get the sum of the integral of a distribution. If the distribution is normalized, this will be 1.

```javascript
(distribution):number
```

**Examples**
```javascript
integralSum(normal(5,2))
```

### add

```javascript
(distributionLike, distributionLike): distribution
```


### sum

```javascript
(list<distributionLike>): distribution
```


### multiply

```javascript
(distributionLike, distributionLike): distribution
```


### product

```javascript
(list<distributionLike>): distribution
```


### subtract

```javascript
(distributionLike, distributionLike): distribution
```


### divide

```javascript
(distributionLike, distributionLike): distribution
```


### pow

```javascript
(distributionLike, distributionLike): distribution
```


### exp

```javascript
(distributionLike, distributionLike): distribution
```


### log

```javascript
(distributionLike, distributionLike): distribution
```


### log10

```javascript
(distributionLike, distributionLike):distribution
```


### unaryMinus

```javascript
(distribution):distribution
```


### dotAdd

```javascript
(distributionLike, distributionLike): distribution
```


### dotSum

```javascript
(list<distributionLike>): distribution
```


### dotMultiply

```javascript
(distributionLike, distributionLike): distribution
```


### dotProduct

```javascript
(list<distributionLike>): distribution
```


### dotSubtract

```javascript
(distributionLike, distributionLike): distribution
```


### dotDivide

```javascript
(distributionLike, distributionLike): distribution
```


### dotPow

```javascript
(distributionLike, distributionLike): distribution
```


### dotExp

```javascript
(distributionLike, distributionLike): distribution
```


### scaleMultiply

```javascript
(distributionLike, distributionLike): distribution
```


### scalePow

```javascript
(distributionLike, distributionLike): distribution
```


### scaleExp

```javascript
(distributionLike, distributionLike): distribution
```


### scaleLog

```javascript
(distributionLike, distributionLike): distribution
```


### scaleLog10

```javascript
(distributionLike, distributionLike): distribution
```


### scaleLogWithThreshold

```javascript
(distributionLike, distributionLike, number): distribution
```

