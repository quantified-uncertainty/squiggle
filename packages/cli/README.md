## Squiggle CLI

This package can be used to incorporate a very simple `import` system into Squiggle.

To use, write special files with a `.squiggleU` file type. In these files, you can write lines like,

```
@import(models/gdp_over_time.squiggle, gdpOverTime)
gdpOverTime(2.5)
```

The imports will be replaced with the contents of the file in `models/gdp_over_time.squiggle` upon compilation. The `.squiggleU` file will be converted into a `.squiggle` file with the `import` statement having this replacement.

## Running

### `npx squiggle-cli-experimental compile`

Runs compilation in the current directory and all of its subdirectories.

### `npx squiggle-cli-experimental watch`

Watches `.squiggleU` files in the current directory (and subdirectories) and rebuilds them when they are saved. Note that this will _not_ rebuild files when their dependencies are changed, just when they are changed directly.

## Further instructions

The above requires having node, npm and npx. To install the first two, see [here](https://nodejs.org/en/), to install npx, run:

```
npm install -g npx
```

Alternatively, you can run the following without the need for npx:

```
npm install squiggle-cli-experimental
node node_modules/squiggle-cli-experimental/index.js compile
```

or you can add a script to your `package.json`, like:

```
 ...
 scripts: {
  "compile": "squiggle-cli-experimental compile"
 }
 ...
```

This can be run with `npm run compile`. `npm` knows how to reach into the node_modules directly, so it's not necessary to specify that.
