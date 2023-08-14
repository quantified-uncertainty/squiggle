[![npm version](https://badge.fury.io/js/@quri%2Fsquiggle-components.svg)](https://www.npmjs.com/package/@quri/squiggle-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/quantified-uncertainty/squiggle/blob/main/LICENSE)

# Squiggle components

This package contains the React components for Squiggle. These can be used either as a library or hosted as a [storybook](https://storybook.js.org/).

The `@quri/squiggle-components` package offers several components and utilities for people who want to embed Squiggle components into websites.

This package is pure ESM; if you have trouble with importing it, read [this document](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Configuration

First, install this library:

```
npm add @quri/squiggle-components # or `yarn add`, or `pnpm add`
```

## Styles

Before using this library, you'll have to make a decision on how to use styles.

There are three options:

### 1. Usage with Tailwind

If you already use Tailwind, you should add `./node_modules/@quri/ui/dist/**/*.js` and `./node_modules/@quri/squiggle-components/dist/**/*.js` to your `tailwind.config.js` [content configuration](https://tailwindcss.com/docs/content-configuration):

```js
module.exports = {
  content: [
    ..., // other files for your own project
    './node_modules/@quri/ui/dist/**/*.js',
    './node_modules/@quri/squiggle-components/dist/**/*.js',
  ],
  plugins: [
    require("@tailwindcss/forms")({ strategy: "class" }), // playground settings use tailwind forms
    require("@quri/squiggle-components/tailwind-plugin"), // some squiggle-components styles extend the default Tailwind's theme
  ],
  ..., // other settings
}
```

It's possible that in the future you might need to change the `content` or `plugins` lists. Please check this README and consult with squiggle-components changelog when you update this library to a new version.

In addition, you should import common styles (these include styles from the JS libraries that we use in squiggle-components):

```js
import "@quri/squiggle-components/common.css";
```

### 2. Usage without Tailwind

You can import the CSS file that we bundle with this library:

```js
import "@quri/squiggle-components/full.css";
```

Note that you have to import this CSS file **only if you don't use Tailwind**.

The downsides of this approach:

- It will include the Tailwind's global [preflight](https://tailwindcss.com/docs/preflight) styles, which do some non-trivial CSS resets, e.g. it resets all heading styles.
- There's a slight risk that your own CSS framework class names will collide with Tailwind class names.

You might want to import squiggle-components CSS _before_ your own CSS resets; in that case, your CSS will get a chance to override the styles that Tailwind's preflight broke for you.

### 3. Configure Tailwind with scoped styles just for this library

This is the approach that we recommend if the previous one doesn't work for you. It's more complicated, though.

First, [install Tailwind](https://tailwindcss.com/docs/installation) in your project.

Then configure Tailwind (in `tailwind.config.js`) in the similar way as the first approach explained above in the "Usage with Tailwind" section:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./node_modules/@quri/ui/dist/**/*.js",
    "./node_modules/@quri/squiggle-components/dist/**/*.js",
  ],
  plugins: [
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@quri/squiggle-components/tailwind-plugin"),
  ],
  corePlugins: {
    preflight: false,
  },
  important: ".squiggle",
};
```

Next, in your CSS file for Tailwind, the one with `@tailwind` directives, you'll have to insert the full Tailwind's [preflight](https://unpkg.com/tailwindcss@3.3.2/src/css/preflight.css), but wrap it in `.squiggle { ... }`. This way, Tailwind's preflight will affect only Squiggle components and nothing else.

This will require you to install [postcss-nested](https://github.com/postcss/postcss-nested) and add it to your `postcss.config.js`, like this:

```js
// postcss.config.js
module.exports = {
  plugins: {
    "postcss-nested": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

You'll also need to include wrapped styles for forms. See `scoped-forms.css` in packages/website to learn how to do that.

Then, add `<TailwindProvider>...</TailwindProvider>` on top of your app (it can be imported from `@quri/ui` package). It will:

1. Add an additional `<div class="squiggle">...</div>` for scoped Tailwind styles.
2. Set up React context that will allow to wrap modals and tooltips with that div too. (This is necessary because our modals and tooltips rely on React portals and jump out of the main DOM tree.)

In addition, you should import common styles (these include styles from the JS libraries that we use in squiggle-components):

```js
import "@quri/squiggle-components/common.css";
```

## Components

Consult with our [Storybook](https://components.squiggle-language.com/) to find out which components you can use.

You'll probably need one of `<SquiggleChart>`, `<SquiggleEditor>` or `<SquigglePlayground>`, depending on your goals.

## Usage with create-react-app

Create React App seems to be [on the way out](https://github.com/reactjs/react.dev/pull/5487#issuecomment-1409720741) and might be not compatible with Squiggle. We recommend looking into ["production-grade React frameworks"](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks) instead.
