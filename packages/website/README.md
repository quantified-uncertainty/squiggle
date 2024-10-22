# Website

This website is built using [Fumadocs](https://fumadocs.vercel.app/), a Next.js-based documentation framework.

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

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) - learn about Fumadocs
