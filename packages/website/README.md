# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## Build for development and production

This one actually works without running `yarn` at the monorepo level, but it doesn't hurt. You must at least run it at this package level

``` sh
yarn
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.
``` sh
yarn build
```

Your local dev server is here, opening up a browser window. 
``` sh
yarn start
```

Most changes are reflected live without having to restart the server.

Clean up the build artefacts. 
``` sh
yarn clean
```
