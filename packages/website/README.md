# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

# Build for development

We assume you ran `yarn` at monorepo level.

The website depends on `squiggle-lang`, which you have to build manually.

```sh
cd ../squiggle-lang
yarn build
```

Generate static content, to the `build` directory.

```sh
yarn build
```

Open a local dev server

```sh
yarn start
```

Most changes are reflected live without having to restart the server.

Clean up the build artefacts.

```sh
yarn clean
```
