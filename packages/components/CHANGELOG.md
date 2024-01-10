# @quri/squiggle-components

## 0.9.1

* Refactored Squiggle-Lang to use Scale methods. Now, there is just SqScale, without subtypes. ([#2829](https://github.com/quantified-uncertainty/squiggle/pull/2829))

* Breaking: Changed Tag.description to Tag.doc ([#2827](https://github.com/quantified-uncertainty/squiggle/pull/2827))

* Fixed RelativeValues plot display ([#2927](https://github.com/quantified-uncertainty/squiggle/pull/2927))

* Fix dist chart legend positioning and how it affects the chart height ([#2911](https://github.com/quantified-uncertainty/squiggle/pull/2911))

* "Fixed documention css quirks in editor" ([#2913](https://github.com/quantified-uncertainty/squiggle/pull/2913))

* Adds Tag.notebook view for Lists ([#2929](https://github.com/quantified-uncertainty/squiggle/pull/2929))

## 0.9.0

* Dates and Durations improvements ([#2572](https://github.com/quantified-uncertainty/squiggle/pull/2572))
  You can now type `Date(2023)` to represent Jan 1 2023.
  Added date domains (`f(x: [Date(1980), Date(2050)])`) that's used in function plots for the x axis.
  Minor changes to the Date library.

* Updated distribution charts to be prettier and better support different sizes ([#2782](https://github.com/quantified-uncertainty/squiggle/pull/2782))

* Hide calculator top when empty, auto-close widgets with strings of <25 chars, expose errors when items are focused. ([#2547](https://github.com/quantified-uncertainty/squiggle/pull/2547))

* `Calculator.make(fn)` works for functions with n>0 params ([#2694](https://github.com/quantified-uncertainty/squiggle/pull/2694))

* Tooltips and inline documentation for stdlib functions in editor ([#2583](https://github.com/quantified-uncertainty/squiggle/pull/2583))

* Breaking: Removed `points(number)` from `Plot.distFn` and `Plot.numericFn` plots, replaced with`xPoints(number[])`. ([#2768](https://github.com/quantified-uncertainty/squiggle/pull/2768))

* Added `window.squiggleOutput` output for debugging ([#2564](https://github.com/quantified-uncertainty/squiggle/pull/2564))

* New dropdown menu on each value in viewer ([#2549](https://github.com/quantified-uncertainty/squiggle/pull/2549))

* Show vertical lines when distribution summary table cells are hovered ([#2585](https://github.com/quantified-uncertainty/squiggle/pull/2585))

* Calculator result functions no longer re-run on input changes. Calculator inputs can be empty, if the function doesn't take any arguments ([#2525](https://github.com/quantified-uncertainty/squiggle/pull/2525))

## 0.8.6

* Added [Calculators](https://www.squiggle-language.com/docs/Api/Calculator), useful for presenting functions to end-users ([#2265](https://github.com/quantified-uncertainty/squiggle/pull/2265), [#2343](https://github.com/quantified-uncertainty/squiggle/pull/2343))

* Added `title` to all [plots](https://www.squiggle-language.com/docs/Api/Plot), and to scales for labeling x and y axes. Added validation for `tickFormat`. ([#2337](https://github.com/quantified-uncertainty/squiggle/pull/2337))

* Highlight multiline strings correctly ([#2302](https://github.com/quantified-uncertainty/squiggle/pull/2302))

## 0.8.5

* Downgrade Typescript target to ES2021. This should help with loading Squiggle components on Observable through unpkg.com. ([#2269](https://github.com/quantified-uncertainty/squiggle/pull/2269))

* Autocompletion improvements: ([#2233](https://github.com/quantified-uncertainty/squiggle/pull/2233))

  * suggest local function names
  * suggest parameter names
  * don't suggest unreachable vars (declared below or in unreachable local scopes)
  * different icon for local functions

  Editor grammar improvements:

  * functions with 0 parameters don't break the parser
  * trailing expressions are now really optional (they weren't, but Lezer recovered from it so it didn't matter)

* Improved symlog scale ticks ([#2245](https://github.com/quantified-uncertainty/squiggle/pull/2245))