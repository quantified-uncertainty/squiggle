# Squiggle Components
This package contains all the components for squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

# Build for development
We assume that you had run `yarn` at monorepo level, installing dependencies. 

You need to _prepare_ by building and bundling `squiggle-lang` 
``` sh
cd ../squiggle-lang
yarn build
```
If you've otherwise done this recently you can skip those.

Run a development server

``` sh
yarn start
```

And build artefacts for production,

``` sh
yarn bundle  # builds components library
yarn build  # builds storybook app
```
