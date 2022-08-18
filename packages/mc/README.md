# `@quri/squiggle-mc` - (hope to be) parallel Monte Carlo with memoization for the `@quri/squiggle-lang` javascript interface

## How to install

Please run `yarn` at the monorepo level.

Please view `/.github/workflows/ci.yml` for the most accurate story about how to build in concert with the rest of the packages in the monorepo.

`nix develop` will set you up quite well. Rust versions for `wasm-pack` and so on could be a pain.

The build you need for the `squiggle-lang` package:

```sh
wasm-pack build --target nodejs
```

the `webpack`/`package.json`/`static` is not active and will be deleted at some point.
