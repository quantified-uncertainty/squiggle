# How to run CLI scripts

Building CLI scripts that reuse Next.js server code can be tricky.

## Auth

`src/lib/server/auth.ts` has some special logic for CLI scripts.

You should set `CLI_MODE=true` and `CLI_USER_EMAIL=...` environment variables. Otherwise, Next.js will try to use the default auth strategy, that relies on `headers()` and other functions that are not available in CLI scripts.

## --conditions

Some server-side modules do `import "server-only"`.

When running CLI scripts with `tsx` or `node`, you need to pass `--conditions=react-server` parameter.

## esbuild

Attempts to run CLI scripts with `tsx ./src/scripts/...` will probably fail with a cryptic React-related error.

You should use `esbuild` instead:

- add your script to `./esbuild.cjs` config
- run `pnpm build:esbuild` to build the script

## CLI-specific code

If your script fails because some server-side function has decided to call `headers()` or `redirect()` (or similar), you should add a check for it.

Example from `getSessionOrRedirect()`:

```ts
if (!isSignedIn(session)) {
  if (CLI_MODE) {
    throw new Error("Unauthorized");
  }
  redirect("/api/auth/signin");
}
```

## Running

Combining all of the above, you can run the script with something like:

```bash
# Build the script
pnpm build:esbuild

# Run the script
CLI_MODE=true CLI_USER_EMAIL=... node --conditions=react-server ./dist/scripts/...
```
