# Squiggle

This is an experiment DSL/language for making probabilistic estimates.

This monorepo has several packages that can be used for various purposes. All 
the packages can be found in `packages`.

`@squiggle/lang` in `packages/squiggle-lang` contains the core language, particularly
an interface to parse squiggle expressions and return descriptions of distributions
or results.

`@squiggle/components` in `packages/components` contains React components that
can be passed squiggle strings as props, and return a presentation of the result
of the calculation.

`@squiggle/playground` in `packages/playground` contains a website for a playground
for squiggle. This website is hosted at `playground.squiggle-language.com`

`@squiggle/website` in `packages/website` The main descriptive website for squiggle,
it is hosted at `squiggle-language.com`.

The playground depends on the components library which then depends on the language.
This means that if you wish to work on the components library, you will need
to package the language, and for the playground to work, you will need to package
the components library and the playground.

Scripts are available for you in the root directory to do important activities,
such as:

`yarn build:lang`. Builds and packages the language
`yarn storybook:components`. Hosts the component storybook

# Local playground

``` sh
yarn build:playground
cd packages/playground
yarn parcel 
```
