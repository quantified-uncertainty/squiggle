## Squiggle CLI

This package can be used to incorporate a very simple `import` system into Squiggle.

To use, write special files with a ``.squiggleU`` file type. In these files, you can write lines like,

```
@import(models/gdp_over_time.squiggle, gdpOverTime)
gdpOverTime(2.5)
```

The imports will be replaced with the contents of the file in `models/gdp_over_time.squiggle` upon compilation. The ``.squiggleU`` file will be converted into a ``.squiggle`` file with the ``import`` statement having this replacement.

## Running

### `npx squiggle-cli-experimental compile`
Runs compilation in the current directory and all of its subdirectories.

### `npx squiggle-cli-experimental watch`
Watches ``.squiggleU`` files in the current directory (and subdirectories) and rebuilds them when they are saved. Note that this will *not* rebuild files when their dependencies are changed, just when they are changed directly.