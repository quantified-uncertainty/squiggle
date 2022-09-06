---
sidebar_position: 10
title: Danger
---

The Danger library contains newer experimental functions which are less stable than Squiggle as a whole. Beware: their name, behavior, namespace or existence may change at any time.

### laplace

```js
Danger.laplace: (number, number) => number
```

Calculates the probability implied by [Laplace's rule of succession](https://en.wikipedia.org/wiki/Rule_of_succession)

```js
trials = 10
successes = 1
Danger.laplace(trials, successes) //  (successes + 1) / (trials + 2)  = 2 / 12 = 0.1666
```

### factorial

```js
Danger.factorial: (number) => number
```

Returns the factorial of a number

### choose

```js
Danger.choose: (number, number) => number
```

`Danger.choose(n,k)` returns `factorial(n) / (factorial(n - k) *.factorial(k))`, i.e., the number of ways you can choose k items from n choices, without repetition. This function is also known as the [binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient).

### binomial

```js
Danger.binomial: (number, number, number) => number
```

`Danger.binomial(n, k, p)` returns `choose((n, k)) * pow(p, k) * pow(1 - p, n - k)`, i.e., the probability that an event of probability p will happen exactly k times in n draws.

### integrateFunctionBetweenWithNumIntegrationPoints

```js
Danger.integrateFunctionBetweenWithNumIntegrationPoints: (number => number, number, number, number) => number
```

`Danger.integrateFunctionBetweenWithNumIntegrationPoints(f, min, max, numIntegrationPoints)` integrates the function `f` between `min` and `max`, and computes `numIntegrationPoints` in between to do so. 

Note that the function `f` has to take in and return numbers. To integrate a function which returns distributios, use:

```js
auxiliaryF(x) = mean(f(x))

Danger.integrateFunctionBetweenWithNumIntegrationPoints(auxiliaryF, min, max, numIntegrationPoints)
```

### integrateFunctionBetweenWithEpsilon

```js
Danger.integrateFunctionBetweenWithEpsilon: (number => number, number, number, number) => number
```

`Danger.integrateFunctionBetweenWithEpsilon(f, min, max, epsilon)` integrates the function `f` between `min` and `max`, and uses an interval of `epsilon` between integration points when doing so. This makes its runtime less predictable than `integrateFunctionBetweenWithNumIntegrationPoints`, because runtime will not only depend on `epsilon`, but also on `min` and `max`.

Same caveats as `integrateFunctionBetweenWithNumIntegrationPoints` apply. 

### optimalAllocationGivenDiminishingMarginalReturnsFunctions2

```js
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions2: (number => number, number => number, number, number) => number
```

`Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions2(f1, f2, funds, approximateIncrement)` computes the optimal allocation of $`funds` between `f1` and `f2`. For the answer given to be correct, `f1` and `f2` will have to be decreasing, i.e., if `x > y`, then `f_i(x) < f_i(y)`

Example:

```js
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions2({|x| 20-x}, {|y| 10}, 100, 0.01)
```

### optimalAllocationGivenDiminishingMarginalReturnsFunctions3 to optimalAllocationGivenDiminishingMarginalReturnsFunctions7

Equivalent to the above, but they take more functional arguments. Their type is given below:

```js
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions3: (number => number, number => number, number => number, number, number) => number
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions5: (number => number, number => number, umber => number, number => number, number, number) => number
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions5: (number => number, number => number, umber => number, number => number, number => number, number, number) => number
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions6: (number => number, number => number, number => number, number => number, number => number, number => number, number, number) => number
Danger.optimalAllocationGivenDiminishingMarginalReturnsFunctions7: (number => number, number => number, number => number, number => number, umber => number, number => number, number => number, number, number) => number
```