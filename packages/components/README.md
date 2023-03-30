[![npm version](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/develop/LICENSE)

# Squiggle components

This package contains the react components for squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

The `@quri/squiggle-components` package offers several components and utilities for people who want to embed Squiggle components into websites.

## Usage in a Next.js project

For now, `squiggle-components` requires the `window` property, so using the package in Next.js requires dynamic loading:

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
          defaultCode={squiggleString}
          width={445}
          height={200}
          showSummary={true}
        />
    );
  }
}
```

You can example of this approach in [this repository](https://github.com/NunoSempere/squiggle-nexjs-example), which you could clone to begin using Squiggle in your project.

## Usage with create-react-app

Create React App seems to be [on the way out](https://github.com/reactjs/react.dev/pull/5487#issuecomment-1409720741) and it is currently not supported by Squiggle. We recommend looking into ["production-grade React frameworks"](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks) instead.

## Build storybook for development

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
