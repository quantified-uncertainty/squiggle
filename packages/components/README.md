[![npm version](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/develop/LICENSE)

# Squiggle components

This package contains the react components for squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

# Usage in a `react` project

For example, in a fresh `create-react-app` project

```sh
yarn add @quri/squiggle-components
```

Add to `App.js`:

```jsx
import { SquiggleEditor } from "@quri/squiggle-components";
<SquiggleEditor initialSquiggleString="x = beta($alpha, 10); x + $shift" jsImports={{alpha: 3, shift: 20}} />;
```

# Build storybook for development

We assume that you had run `yarn` at monorepo level, installing dependencies.

You need to _prepare_ by building and bundling `squiggle-lang`

```sh
cd ../squiggle-lang
yarn build
```

If you've otherwise done this recently you can skip those.

Run a development server

```sh
yarn start
```
