Various scripts used for development and benchmarking.

None of these are bundled in the NPM package.

# How to run these scripts

Option 1. `ts-node ./scripts/run.ts`. Slow, but doesn't require rebuilds.

Option 2. Run `pnpm build` and then `node ./dist/esm/src/scripts/run.js`.
