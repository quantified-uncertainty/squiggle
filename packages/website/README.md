# Website

This website is built using [Nextra](https://nextra.site/), a Next.js-based site generation framework.

# Build for development

We assume you ran `pnpm i`.

Build dependencies:

```sh
npx turbo build --filter=squiggle-website^...
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
