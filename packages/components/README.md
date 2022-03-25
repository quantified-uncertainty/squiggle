# Squiggle Components
This package contains all the components for squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

# Build for development
You need to _prepare_ by building and bundling `squiggle-lang` 
``` sh
cd ../squiggle-language
yarn
yarn build
yarn bundle
```
If you've otherwise done this recently you can skip those.

Then, you can install dependencies
``` sh
cd packages/components
yarn 
```

Run a development server

``` sh
yarn start
```

And build artefacts for production,

``` sh
yarn bundle  # builds components library
yarn build  # builds storybook app
```
