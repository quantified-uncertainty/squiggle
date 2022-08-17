# `@quri/squiggle-mc` - parallel Monte Carlo with memoization for the `@quri/squiggle-lang` javascript interface

## How to install

Please run `yarn` at the monorepo level. 

In this subrepo, please run `./cargo-refresh-nix.sh` every time `Cargo.toml`/`Cargo.lock` is modified, it requires nix with flakes. 

## How to run in debug mode

```sh
# Builds the project and opens it in a new browser tab. Auto-reloads when the project changes.
yarn start
```

## How to build in release mode

```sh
# Builds the project and places it into the `dist` folder.
yarn build
```

## How to run unit tests

These are the headless browser tests, which will attempt to download and install drivers, and may fail. 

```sh
# Runs tests in Firefox
yarn test -- --firefox

# Runs tests in Chrome
yarn test -- --chrome

# Runs tests in Safari
yarn test -- --safari
```

## What does each file do?

* `Cargo.toml` contains the standard Rust metadata. You put your Rust dependencies in here. You must change this file with your details (name, description, version, authors, categories)

* `package.json` contains the standard npm metadata. You put your JavaScript dependencies in here. You must change this file with your details (author, name, version)

* `webpack.config.js` contains the Webpack configuration. You shouldn't need to change this, unless you have very special needs.

* The `js` folder contains your JavaScript code (`index.js` is used to hook everything into Webpack, you don't need to change it).

* The `src` folder contains your Rust code.

* The `static` folder contains any files that you want copied as-is into the final build. It contains an `index.html` file which loads the `index.js` file.

* The `tests` folder contains your Rust unit tests.
