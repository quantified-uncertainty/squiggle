---
sidebar_position: 11
title: Danger_Aggregate
---

The Danger_Aggregate library contains a variety of functions useful for aggregating probabilities. As the `Danger_` prefix indicates, we don't make claims about its stability. Eventually, we may drop the prefix as this becomes an aggregation library inside Squiggle.

Note that its functions invariably take probabilities, rather than odds, as arguments. 


### arithmeticMean

```js
Danger_Aggregate.arithmeticMean: (List<number>, number) => number
```

Computes the arithmetic mean. 

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.arithmeticMean(trials, successes);
```

### geomMean

```js
Danger_Aggregate.geomMean: (List<number>, number) => number
```

Computes the geometric mean. 

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.geomMean(trials, successes);
```

### geomMeanOfOdds

```js
Danger_Aggregate.geomMeanOfOdds: (List<number>, number) => number
```

Computes the geometric mean of the odds. 

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.geomMeanOfOdds(trials, successes);
```

Note that the inputs are still probabilities, rather than odds.

### extremizedGeometricMeanOfOdds

```js
Danger_Aggregate.extremizedGeometricMeanOfOdds: (List<number>, number) => number
```

Computes the extremized geometric mean of the odds, according to [this paper](https://arxiv.org/abs/2111.03153) by Neyman and Roughgarden—see also an explanation by Sevilla [here](https://forum.effectivealtruism.org/posts/biL94PKfeHmgHY6qe/principled-extremizing-of-aggregated-forecasts).

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.extremizedGeometricMeanOfOdds(trials, successes);
```

Note that the inputs are still probabilities, rather than odds.

This function is also available under the shorter `neyman` alias:

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.extremizedGeometricMeanOfOdds(trials, successes);
```

### geomMeanOfOddsWithoutExtremes

```js
Danger_Aggregate.geomMeanOfOddsWithoutExtremes: (List<number>, number) => number
```

Computes the geometric mean of the odds, excluding the lowest and highest probabilities. Requires that the input array have at least three members.

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.geomMeanOfOddsWithoutExtremes(trials, successes);
```

This function is also available under the shorter `samotsvety` alias, because it is preferred by the [Samotsvety](https://samotsvety.org/) group.

```js
ps = [0.1, 0.2, 0.3]
Danger_Aggregate.samotsvety(trials, successes);
```
