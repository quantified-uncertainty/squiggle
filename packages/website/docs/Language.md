---
sidebar_position: 1
---

# Squiggle Language

## Distributions
```js
normal(a,b)
uniform(a,b)
lognormal(a,b)
lognormalFromMeanAndStdDev(mean, stdev)
beta(a,b)
exponential(a)
triangular(a,b,c)
mm(a,b,c, [1,2,3])
cauchy() //todo
pareto() //todo
```

## Functions
```js
trunctate() //todo
leftTrunctate() //todo
rightTrunctate()//todo
```

## Functions
```js
pdf(distribution, float)
inv(distribution, float)
cdf(distribution, float)
mean(distribution)
sample(distribution)
scaleExp(distribution, float)
scaleMultiply(distribution, float)
scaleLog(distribution, float)
```

## Example Functions

```js
ozzie_estimate(t) = lognormal({mean: 3 + (t+.1)^2.5, stdev: 8})
nuño_estimate(t) = lognormal({mean: 3 + (t+.1)^2, stdev: 10})
combined(t) = mm(ozzie_estimate(t) .+ nuño_estimate(t))
combined
```

```js
us_economy_2018 = (10.5 to 10.9)T
growth_rate = 1.08 to 1.2
us_economy(t) = us_economy_2018 * (growth_rate^t)

us_population_2019 = 320M to 330M
us_population_growth_rate = 1.01 to 1.1
us_population(t) = us_population_2019 * (us_population_growth_rate^t)
gdp_per_person(t) = us_economy(t)/us_population(t)
gdp_per_person

gdp_per_person
```