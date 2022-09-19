Various scripts used for development, benchmarking and testing.

None of these are bundled in the NPM package yet.

# run.mjs

`scripts/run.mjs` allows quick testing of Squiggle programs:

```
$ ./scripts/run.mjs '2+2'
Running 2+2
Ok 4
@{__result__: 4}
```

# run-file.mjs

`scripts/run-file.mjs` can be used to run and benchmark squiggle scripts stored in files:

```
$ ./scripts/run-file.mjs ./path/to/file.squiggle
Time: 3.18 Ok
```

To see the result and bindings, add the `-o` or `--output` flag.
