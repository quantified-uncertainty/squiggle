# Squiggle

This is an experiment DSL/language for making probabilistic estimates.

## DistPlus 
We have a custom library called DistPlus to handle distributions with additional metadata. This helps handle mixed distributions (continuous + discrete), a cache for a cdf, possible unit types (specific times are supported), and limited domains.

## Running packages in the monorepo
This application uses `lerna` to manage dependencies between packages. To install
dependencies of all packages, run:

```
lerna bootstrap
```
