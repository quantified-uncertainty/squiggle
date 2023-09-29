# @quri/squiggle-components

## 0.8.6

### Patch Changes

- Added calculator class to squiggle-lang and calculator component to squiggle-components. Useful for presenting functions to end-users. ([#2265](https://github.com/quantified-uncertainty/squiggle/pull/2265))

## 0.8.5

### Patch Changes

- Downgrade Typescript target to ES2021. This should help with loading Squiggle components on Observable through unpkg.com. ([#2269](https://github.com/quantified-uncertainty/squiggle/pull/2269))

- Autocompletion improvements: ([#2233](https://github.com/quantified-uncertainty/squiggle/pull/2233))

  - suggest local function names
  - suggest parameter names
  - don't suggest unreachable vars (declared below or in unreachable local scopes)
  - different icon for local functions

  Editor grammar improvements:

  - functions with 0 parameters don't break the parser
  - trailing expressions are now really optional (they weren't, but Lezer recovered from it so it didn't matter)

- Improved symlog scale ticks ([#2245](https://github.com/quantified-uncertainty/squiggle/pull/2245))
