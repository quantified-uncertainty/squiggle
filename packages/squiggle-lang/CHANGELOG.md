# @quri/squiggle-lang

## 0.8.6

### Patch Changes

- Added calculator class to squiggle-lang and calculator component to squiggle-components. Useful for presenting functions to end-users. ([#2265](https://github.com/quantified-uncertainty/squiggle/pull/2265))

- Breaking: Changed Calculator fields attribute, to inputs, which now requires Input objects. These allow for multiple types of inputs ([#2343](https://github.com/quantified-uncertainty/squiggle/pull/2343))

- Added sampleCount field to Calculator.make ([#2474](https://github.com/quantified-uncertainty/squiggle/pull/2474))

- Added title to all plots, and to scales for xAxisLabel and yAxisLabel. Added validation for tickFormat. ([#2337](https://github.com/quantified-uncertainty/squiggle/pull/2337))

- Improved mixture() typing, but limited to 5 parameters maximum. Also adjusted SqLambda to output SqLamdaParameters. ([#2334](https://github.com/quantified-uncertainty/squiggle/pull/2334))

- ([#2300](https://github.com/quantified-uncertainty/squiggle/pull/2300))

- Added Dict.pick, Dict.omit ([#2376](https://github.com/quantified-uncertainty/squiggle/pull/2376))

- Number.sum, product, sort, cumsum, cumprod, should all accept lists with 0 elements ([#2351](https://github.com/quantified-uncertainty/squiggle/pull/2351))

- Added Dist.sum, Dist.product, Dist.cumsum, Dist.cumprod, Dist.diff ([#2356](https://github.com/quantified-uncertainty/squiggle/pull/2356))

- Added List.slice, Danger.combinations, Danger.allCombinations ([#2347](https://github.com/quantified-uncertainty/squiggle/pull/2347))

## 0.8.5

### Patch Changes

- Downgrade Typescript target to ES2021. This should help with loading Squiggle components on Observable through unpkg.com. ([#2269](https://github.com/quantified-uncertainty/squiggle/pull/2269))

- Added support for `%` as a number suffix ([#2239](https://github.com/quantified-uncertainty/squiggle/pull/2239))

- Support `pow(dist, integer)` on distributions with negative samples ([#2235](https://github.com/quantified-uncertainty/squiggle/pull/2235))
