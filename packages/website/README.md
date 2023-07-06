# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

# Build for development

We assume you ran `pnpm i`.

Build dependencies:

```sh
npx turbo build --filter=@quri/website^...
```

Open a local dev server:

```sh
pnpm dev
```

Most changes are reflected live without having to restart the server.

Build static website:

```sh
npx turbo build
```

Clean up the build artefacts:

```sh
pnpm clean
```
