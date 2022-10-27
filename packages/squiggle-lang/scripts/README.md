Various scripts used for development, benchmarking and testing.

None of these are bundled in the NPM package yet.

# How to run these scripts

Option 1. `ts-node ./scripts/run.ts`. Slow, but doesn't require rebuilds.

Option 2. Run `yarn build` and then `node ./dist/scripts/run.js`.

# Scripts

## run.ts

`scripts/run.ts` allows quick testing of Squiggle programs:

```
$ ts-node ./scripts/run.ts '2+2'
Result: Ok 4
Bindings: {}
Time: 0.003 Ok
```

## run-file.ts

`scripts/run-file.ts` can be used to run and benchmark squiggle scripts stored in files:

```
$ ts-node ./scripts/run-file.ts ./path/to/file.squiggle
Time: 3.18 Ok
```

To see the result and bindings, add the `-o` or `--output` flag.
