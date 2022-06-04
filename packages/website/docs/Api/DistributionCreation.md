---
sidebar_position: 1
title: Distribution Creation
---

## Normal Distribution

**Definitions**  
```javascript
normal(frValueDistOrNumber, frValueDistOrNumber)
```
```javascript
normal(dict<{p5: frValueDistOrNumber, p95: frValueDistOrNumber}>)
```
```javascript
normal(dict<{mean: frValueDistOrNumber, stdev: frValueDistOrNumber}>)
```

**Examples**
```javascript
normal(5,1)
normal({p5: 4, p95: 10})
normal({mean: 5, stdev: 2})
```

## Lognormal Distribution

**Definitions**  
```javascript
lognormal(frValueDistOrNumber, frValueDistOrNumber)
```
```javascript
lognormal(dict<{p5: frValueDistOrNumber, p95: frValueDistOrNumber}>)
```
```javascript
lognormal(dict<{mean: frValueDistOrNumber, stdev: frValueDistOrNumber}>)
```

**Examples**
```javascript
lognormal(0.5, 0.8)
lognormal({p5: 4, p95: 10})
lognormal({mean: 5, stdev: 2})
```

## Uniform Distribution

**Definitions**  
```javascript
uniform(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
uniform(10, 12)
```

## Beta Distribution

**Definitions**  
```javascript
beta(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
beta(20, 25)
```

## Cauchy Distribution

**Definitions**  
```javascript
cauchy(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
cauchy(5, 1)
```

## Gamma Distribution

**Definitions**  
```javascript
gamma(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
gamma(5, 1)
```

## Logistic Distribution

**Definitions**  
```javascript
logistic(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
gamma(5, 1)
```

## To (Distribution)

**Definitions**  
```javascript
to(frValueDistOrNumber, frValueDistOrNumber)
```
```javascript
credibleIntervalToDistribution(frValueDistOrNumber, frValueDistOrNumber)
```

**Examples**
```javascript
5 to 10
to(5,10)
-5 to 5
```

## Exponential

**Definitions**  
```javascript
exponential(frValueDistOrNumber)
```

**Examples**
```javascript
exponential(2)
```

## Bernoulli

**Definitions**  
```javascript
bernoulli(frValueDistOrNumber)
```

**Examples**
```javascript
bernoulli(0.5)
```

## toContinuousPointSet
Converts a set of points to a continuous distribution

**Definitions**  
```javascript
toContinuousPointSet(array<dict<{x: numeric, y: numeric}>>)
```

**Examples**
```javascript
toContinuousPointSet([
  {x: 0, y: 0.1},
  {x: 1, y: 0.2},
  {x: 2, y: 0.15},
  {x:3, y: 0.1}
])
```

## toDiscretePointSet
Converts a set of points to a discrete distribution

**Definitions**  
```javascript
toDiscretePointSet(array<dict<{x: numeric, y: numeric}>>)
```

**Examples**
```javascript
toDiscretePointSet([
  {x: 0, y: 0.1},
  {x: 1, y: 0.2},
  {x: 2, y: 0.15},
  {x:3, y: 0.1}
])
```

## Declaration (Continuous Function)
Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.

**Definitions**  
```javascript
declareFn(dict<{fn: lambda, inputs: array<dict<{min: number, max: number}>>}>)
```

**Examples**
```javascript
declareFn({
  fn: {|a,b| a },
  inputs: [
    {min: 0, max: 100},
    {min: 30, max: 50}
  ]
})
```