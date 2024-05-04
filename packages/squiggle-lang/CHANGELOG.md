# @quri/squiggle-lang

## 0.9.4

Standard library:

- Added `Spec.make` function and `@spec` tag ([#3113](https://github.com/quantified-uncertainty/squiggle/pull/3113))

- Added the basic `try()` function ([#3137](https://github.com/quantified-uncertainty/squiggle/pull/3137))

- Added `PointSet.support` function and a new `MixedSet.*` namespace with several functions for working with 1-dimensional sets of points and segments ([#3115](https://github.com/quantified-uncertainty/squiggle/pull/3115), [#3151](https://github.com/quantified-uncertainty/squiggle/pull/3151))

- Added `Danger.yTransform` function ([#3127](https://github.com/quantified-uncertainty/squiggle/pull/3127))

Bugfixes:

- Fixed the issue with very slightly negative KDE values because of floating point errors ([#3114](https://github.com/quantified-uncertainty/squiggle/pull/3114))

- Fixed parsing of `x = {|...|...} -> ...` statements([#3136](https://github.com/quantified-uncertainty/squiggle/pull/3136))

Internals:

- Use a custom PRNG (aleaPRNG) and always require seed in environment ([#3006](https://github.com/quantified-uncertainty/squiggle/pull/3006))

  - Note that this can make some models up to 2x slower, because it's hard to beat the native `Math.random`; but we'll make up for it with other optimizations in future releases

- Variable stack is array-based, with up to 50% better performance in synthetic tests ([#3054](https://github.com/quantified-uncertainty/squiggle/pull/3054))

- All Squiggle values are serializable ([#3158](https://github.com/quantified-uncertainty/squiggle/pull/3158))

- Support pluggable runners, including the experimental webworker runner ([#3158](https://github.com/quantified-uncertainty/squiggle/pull/3158))

- Simplified AST representation ([#3136](https://github.com/quantified-uncertainty/squiggle/pull/3136))

- Disallow overrides of an internal function responsible for index lookups ([#3135](https://github.com/quantified-uncertainty/squiggle/pull/3135))

## 0.9.3

- Breaking: disallow capitalized variable names that we allowed by accident in 0.9.0 release ([#2987](https://github.com/quantified-uncertainty/squiggle/pull/2987))

- Added `@location` tag and `Tag.getLocation` ([#3011](https://github.com/quantified-uncertainty/squiggle/pull/3011))

- Added `@startOpen`, `@startClosed`, and `Tag.getStartOpenState` ([#2975](https://github.com/quantified-uncertainty/squiggle/pull/2975))

- Added `Danger.parseFloat`, `System.sampleCount` and `Danger.now` ([#2974](https://github.com/quantified-uncertainty/squiggle/pull/2974))

- `SqOutput` includes a separate `imports` dictionary; all exports are tagged with `exportData` tag. ([#2969](https://github.com/quantified-uncertainty/squiggle/pull/2969))

- Bug fix: `@format` tag now works on 0 values ([#2961](https://github.com/quantified-uncertainty/squiggle/pull/2961))

Internals:

- Added `versionAdded` flag for built-in functions, for documenting the version when the function became available ([#2965](https://github.com/quantified-uncertainty/squiggle/pull/2965))

- Infrastructure for custom seedable PRNGs ([#2992](https://github.com/quantified-uncertainty/squiggle/pull/2992))

## 0.9.2

- Breaking: Deprecated `Plot` titles ([#2925](https://github.com/quantified-uncertainty/squiggle/pull/2925))

- Breaking: Renamed `Tag.all` -> `Tag.getAll` ([#2925](https://github.com/quantified-uncertainty/squiggle/pull/2925))

- Breaking: Renamed `Tag.description` to `Tag.doc` ([#2827](https://github.com/quantified-uncertainty/squiggle/pull/2827))

- Fix `isEqual` and `==` for Squiggle Lists ([#2920](https://github.com/quantified-uncertainty/squiggle/pull/2920))

- Added `throw` function ([#2941](https://github.com/quantified-uncertainty/squiggle/pull/2941))

- Adds `Tag.notebook` view for Lists ([#2929](https://github.com/quantified-uncertainty/squiggle/pull/2929))

## 0.9.0

- Support for tags (`Tag.*` functions) and decorators (`@decoratorName`) that can be used to affect how the value is displayed. ([`b5d1394`](https://github.com/quantified-uncertainty/squiggle/commit/b5d139465c72a742b0ac319068d4acc1d7ab0e4d))
  Tags can be attached to any value, and decorators can be attached to any variable or function definition.
  Decorators are proxied to Tag functions, e.g. `@name("X var") x = 5` is the same as `x = 5 -> Tag.name("X var")`.
  Builtin tags: `@name`, `@description`, `@format`, `@showAs`, `@hide`.

* Dates and Durations improvements ([#2572](https://github.com/quantified-uncertainty/squiggle/pull/2572))
  You can now type `Date(2023)` to represent Jan 1 2023.
  Added date domains (`f(x: [Date(1980), Date(2050)])`) that's used in function plots for the x axis.
  Minor changes to the Date library.

* Added `Calculator.make(fn)` shorthand ([#2660](https://github.com/quantified-uncertainty/squiggle/pull/2660))

* Updated distribution charts to be prettier and better support different sizes ([#2782](https://github.com/quantified-uncertainty/squiggle/pull/2782))

* Tag percentage values with percentage format, so that they're rendered as percentages in viewer ([#2759](https://github.com/quantified-uncertainty/squiggle/pull/2759))

* Added `List.sortBy`, `List.maxBy`, `List.minBy`, `Dict.has`, `Dict.size`, `Dict.delete`, and added definitions to `Number.min` and `Number.max` that support two number params ([#2551](https://github.com/quantified-uncertainty/squiggle/pull/2551))

* Removed `title` attribute from `Table.make()`; you can use `@name` and `@description` tags instead ([#2718](https://github.com/quantified-uncertainty/squiggle/pull/2718))

* `Calculator.make(fn)` works for functions with n>0 params ([#2694](https://github.com/quantified-uncertainty/squiggle/pull/2694))

* Expose `getFunctionDocumentation` function to render documentatiton in the playground ([#2583](https://github.com/quantified-uncertainty/squiggle/pull/2583))

* Breaking: Change `Number.rangeDomain({min, max})` to be `rangeDomain(min, max)` ([#2692](https://github.com/quantified-uncertainty/squiggle/pull/2692))

* Alias `Module.make()` methods to `Module()` ([#2681](https://github.com/quantified-uncertainty/squiggle/pull/2681))

* Breaking: Removed `points(number)` from `Plot.distFn` and `Plot.numericFn` plots, replaced with`xPoints(number[])`. ([#2768](https://github.com/quantified-uncertainty/squiggle/pull/2768))

* Added `Dist.median`, `Number.quantile`, `Number.median` ([#2577](https://github.com/quantified-uncertainty/squiggle/pull/2577))

* Added data-first definitions for `Plot.dist`, `Plot.dists`, `Plot.numericFn`, `Plot.distFn`, `Table.make`, `Calculator.make`. Deprecate old versions. ([#2676](https://github.com/quantified-uncertainty/squiggle/pull/2676))

* Breaking: `Plot.scatter` now only accepts sampleset distributions. ([#2655](https://github.com/quantified-uncertainty/squiggle/pull/2655))

* Calculator result functions no longer re-run on input changes. Calculator inputs can be empty, if the function doesn't take any arguments ([#2525](https://github.com/quantified-uncertainty/squiggle/pull/2525))

* Fix `!` operator: `!0` now evaluates to `true`, and `!1` to `false` ([#2658](https://github.com/quantified-uncertainty/squiggle/pull/2658))

* Fix pointwise combination precision issues on discrete PointSet dists. This was affecting `mixture` and pointwise operators. ([#2514](https://github.com/quantified-uncertainty/squiggle/pull/2514))

## 0.8.6

- Added [Calculators](https://www.squiggle-language.com/docs/Api/Calculator), useful for presenting functions to end-users ([#2265](https://github.com/quantified-uncertainty/squiggle/pull/2265), [#2343](https://github.com/quantified-uncertainty/squiggle/pull/2343))

- Added `title` to all [plots](https://www.squiggle-language.com/docs/Api/Plot), and to scales for labeling x and y axes. Added validation for `tickFormat`. ([#2337](https://github.com/quantified-uncertainty/squiggle/pull/2337))

- Improved [mixture()](https://www.squiggle-language.com/docs/Api/Dist#mixture) typing, but limited to 5 parameters maximum ([#2334](https://github.com/quantified-uncertainty/squiggle/pull/2334))

- Added [Dict.pick](https://www.squiggle-language.com/docs/Api/Dictionary#pick), [Dict.omit](https://www.squiggle-language.com/docs/Api/Dictionary#omit) ([#2376](https://github.com/quantified-uncertainty/squiggle/pull/2376))

- [sum](https://www.squiggle-language.com/docs/Api/Number#sum), [product](https://www.squiggle-language.com/docs/Api/Number#product), [sort](https://www.squiggle-language.com/docs/Api/Number#sort), [cumsum](https://www.squiggle-language.com/docs/Api/Number#cumulative-sum), [cumprod](https://www.squiggle-language.com/docs/Api/Number#cumulative-product) all accept lists with 0 elements ([#2351](https://github.com/quantified-uncertainty/squiggle/pull/2351))

- Added [Dist.sum](https://www.squiggle-language.com/docs/Api/Dist#sum), [Dist.product](https://www.squiggle-language.com/docs/Api/Dist#product), [Dist.cumsum](https://www.squiggle-language.com/docs/Api/Dist#cumulative-sum), [Dist.cumprod](https://www.squiggle-language.com/docs/Api/Dist#cumulative-product), [Dist.diff](https://www.squiggle-language.com/docs/Api/Dist#diff) ([#2356](https://github.com/quantified-uncertainty/squiggle/pull/2356))

- Added [List.slice](https://www.squiggle-language.com/docs/Api/List#slice), [Danger.combinations](https://www.squiggle-language.com/docs/Api/Danger#combinations), [Danger.allCombinations](https://www.squiggle-language.com/docs/Api/Danger#allcombinations) ([#2347](https://github.com/quantified-uncertainty/squiggle/pull/2347))

- Added more standard library functions: [typeOf](https://www.squiggle-language.com/docs/Api/Builtin#typeof), [List.every](https://www.squiggle-language.com/docs/Api/List#every), [List.some](https://www.squiggle-language.com/docs/Api/List#some), [List.find](https://www.squiggle-language.com/docs/Api/List#find), [List.findIndex](https://www.squiggle-language.com/docs/Api/List#findindex), [List.zip](https://www.squiggle-language.com/docs/Api/List#zip), [List.unzip](https://www.squiggle-language.com/docs/Api/List#unzip), [List.shuffle](https://www.squiggle-language.com/docs/Api/List#shuffle), [List.uniq](https://www.squiggle-language.com/docs/Api/List#uniq) (works with more types now), [List.uniqBy](https://www.squiggle-language.com/docs/Api/List#uniqby), [Dist.make](https://www.squiggle-language.com/docs/Api/Dist#make), [PointSet.fromNumber](https://www.squiggle-language.com/docs/Api/DistPointSet#fromnumber), [PointSet.make](https://www.squiggle-language.com/docs/Api/DistPointSet#make), [SampleSet.fromNumber](https://www.squiggle-language.com/docs/Api/DistSampleSet#fromnumber), [SampleSet.make](https://www.squiggle-language.com/docs/Api/DistSampleSet#make), [String.make](https://www.squiggle-language.com/docs/Api/String#make), [String.split](https://www.squiggle-language.com/docs/Api/String#split) ([#2290](https://github.com/quantified-uncertainty/squiggle/pull/2290))

- Expanded equality comparisons to include all distributions, dates, time durations, scales, domains, arrays, and dictionaries.

## 0.8.5

- Downgrade Typescript target to ES2021. This should help with loading Squiggle components on Observable through unpkg.com. ([#2269](https://github.com/quantified-uncertainty/squiggle/pull/2269))

- Added support for `%` as a number suffix ([#2239](https://github.com/quantified-uncertainty/squiggle/pull/2239))

- Support `pow(dist, integer)` on distributions with negative samples ([#2235](https://github.com/quantified-uncertainty/squiggle/pull/2235))
