# Squiggle Language
Squiggle is a language for representing probability distributions, as well as 
functions that return probability distributions. Its original intended use is
for improving epistemics around EA decisions.

This package, @squiggle/lang, contains the core language of squiggle. The main
feature revolves around evaluating squiggle expressions. Currently the package
only exports a single function, named "run", which from a squiggle string returns
an object representing the result of the evaluation.

If using this package for tests or as a dependency, typescript typings are available
and recommended to be used.

## Building this package
This package doesn't have any dependencies on any other packages within the monorepo,
so if you wish you can generally ignore lerna or yarn workspaces when dealing
with this package in particular.

First, as per any node package, you will need to install dependencies, we recommend
using [yarn](https://classic.yarnpkg.com/en/).

```bash
yarn
```

This package is mainly written in [ReScript](https://rescript-lang.org/). But has
a typescript interface.

ReScript has an interesting philosophy of not providing much in the way of effective
build tools. Every ReScript file is compiled into a .bs.js file with the same name
and same location, and then you can use these .bs.js files in other js files to
create your program. To generate this .bs.js files to build the package, you run
`yarn build`.

```bash
yarn build
```

You can also go `yarn start` for the purposes of watching for file changes and 
rebuilding every time there is one.

Finally, `yarn test` runs the current test suite over the language.

## Distributing this package or using this package from other monorepo packages
If you would like to distribute this package, run `yarn package` to compile all the js
and typescript into the `dist` directory. This `dist` directory code is what's
referenced by other packages in the monorepo.

## Using this package
The return type of this packages only experted function `run` is currently quite 
complicated, as it has to return either a number, or a distribution, or even
a representation of a function of distributions. Currently the export is simply
the generated type that rescript creates, and can be quite confusing. We therefore
highly recommend the use of typescript when creating tests or using this package.
