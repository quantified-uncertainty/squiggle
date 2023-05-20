# @quri/ui - Common UI components for QURI projects

## Configuration

First, install the library:

```
yarn add @quri/ui # or npm install if you use npm
```

Then you have two options:

### Usage with Tailwind

If you use Tailwind, you should add `./node_modules/@quri/ui/dist/**/*.js` to your `tailwind.config.js` [content configuration](https://tailwindcss.com/docs/content-configuration):

```js
module.exports = {
  content: [
    ..., // files for your own project
    './node_modules/@quri/ui/dist/**/*.js',
  ],
  // ...
}
```

If you plan to use form elements, you'll also need to enable [tailwindcss-forms](https://github.com/tailwindlabs/tailwindcss-forms) plugin:

```js
module.exports = {
  ...,
  plugins: [
    require('@tailwindcss/forms'),
    // ...
  ],
}
```

### Usage without Tailwind

If you don't use Tailwind, you can try `import "@quri/ui/dist/main.css"` instead.

But beware: this stylesheet includes the entire Tailwind Preflight, which will reset your global styles. It will also add global Tailwind classnames (e.g. `.block` and `.flex`) to your stylesheet, which might be a problem if you use a different CSS framework.

So usage with Tailwind is recommended even if you don't use Tailwind yourself. That way you could [disable Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight) and containerize `@quri/ui` styles with [`important` selector](https://tailwindcss.com/docs/configuration#selector-strategy).

```

```
