[![npm version](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/develop/LICENSE)

# Squiggle components

This package contains the react components for squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

The `@quri/squiggle-components` package offers several components and utilities for people who want to embed Squiggle components into websites.

# Usage in a `react` project

For example, in a fresh `create-react-app` project

```sh
yarn add @quri/squiggle-components
```

Add to `App.js`:

```jsx
import { SquiggleEditor } from "@quri/squiggle-components";
<SquiggleEditor
  squiggleString="x = beta($alpha, 10); x + $shift"
  jsImports={{ alpha: 3, shift: 20 }}
/>;
```

# Usage in a Nextjs project

For now, `squiggle-components` requires the `window` property, so using the package in nextjs requires dynamic loading:

```

import React from "react";
import { SquiggleChart } from "@quri/squiggle-components";

import dynamic from "next/dynamic";

const SquiggleChart = dynamic(
  () => import("@quri/squiggle-components").then((mod) => mod.SquiggleChart),
  {
    loading: () => <p>Loading...</p>,
    ssr: false,
  }
);

export function DynamicSquiggleChart({ squiggleString }) {
  if (squiggleString == "") {
    return null;
  } else {
    return (
        <SquiggleChart
          squiggleString={squiggleString}
          width={445}
          height={200}
          showSummary={true}
          showTypes={true}
        />
    );
  }
}

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
