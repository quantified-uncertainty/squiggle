---
description: The Danger library contains newer experimental functions which are less stable than Squiggle as a whole. These functions are used for statistical calculations and logarithmic scaling operations.
---

# Danger

The Danger library contains newer experimental functions which are less stable than Squiggle as a whole. Beware: their name, behavior, namespace or existence may change at any time.

### laplace

```
Danger.laplace: (number, number) => number
```

Calculates the probability implied by [Laplace's rule of succession](https://en.wikipedia.org/wiki/Rule_of_succession)

```squiggle
trials = 10
successes = 1
Danger.laplace(trials, successes); //  (successes + 1) / (trials + 2)  = 2 / 12 = 0.1666
```

### factorial

```
Danger.factorial: (number) => number
```

Returns the factorial of a number

### choose

```
Danger.choose: (number, number) => number
```

`Danger.choose(n,k)` calculates the binomial coefficient, also known as "n choose k". It returns the total number of ways to choose k items from n choices, without repetition. The calculation is done using the formula `factorial(n) / (factorial(n - k) * factorial(k))`.

### binomial

```
Danger.binomial: (number, number, number) => number
```

`Danger.binomial(n, k, p)` returns `choose((n, k)) * pow(p, k) * pow(1 - p, n - k)`, i.e., the probability that an event of probability p will happen exactly k times in n draws.

### integrateFunctionBetweenWithNumIntegrationPoints

```
Danger.integrateFunctionBetweenWithNumIntegrationPoints: (number => number, number, number, number) => number
```

`Danger.integrateFunctionBetweenWithNumIntegrationPoints(f, min, max, numIntegrationPoints)` integrates the function `f` between `min` and `max`, with a specified number of integration points. The function `f` should take in and return numbers. If you need to integrate a function that returns distributions, use an auxiliary function that returns the mean of `f(x)`.

Note that the function `f` has to take in and return numbers. To integrate a function which returns distributios, use:

```squiggle
auxiliaryF(x) = mean(f(x))

Danger.integrateFunctionBetweenWithNumIntegrationPoints(auxiliaryF, min, max, numIntegrationPoints)
```

### integrateFunctionBetweenWithEpsilon

```
Danger.integrateFunctionBetweenWithEpsilon: (number => number, number, number, number) => number
```

`Danger.integrateFunctionBetweenWithEpsilon(f, min, max, epsilon)` integrates the function `f` between `min` and `max`, and uses an interval of `epsilon` between integration points when doing so. This makes its runtime less predictable than `integrateFunctionBetweenWithNumIntegrationPoints`, because runtime will not only depend on `epsilon`, but also on `min` and `max`.

Same caveats as `integrateFunctionBetweenWithNumIntegrationPoints` apply.

### optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions

```
Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions: (array<number => number>, number, number) => number
```

`Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions([f1, f2], funds, approximateIncrement)` computes the optimal allocation of $`funds` between `f1` and `f2`. For the answer given to be correct, `f1` and `f2` will have to be decreasing, i.e., if `x > y`, then `f_i(x) < f_i(y)`.

Example:

```squiggle
Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions(
  [
    {|x| 20-x},
    {|y| 10}
  ],
  100,
  0.01
)
```

Note also that the array ought to have more than one function in it.


### allCombinations
```
Danger.allCombinations: (list<any>) => list<list<any>>
```
Returns all possible combinations of the elements in the input list.

```squiggle
Danger.allCombinations([1, 2, 3])) // [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]
```### combinations
```
Danger.combinations: (list<any>, number) => list<list<any>>
```
Generates all possible combinations of length r from the given list. 

```squiggle
Danger.combinations([1, 2, 3], 2)) // [[1, 2], [1, 3], [2, 3]]
```

Returns all possible combinations of any length from the given list.