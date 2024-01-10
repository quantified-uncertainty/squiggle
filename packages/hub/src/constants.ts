// Don't try to destructure this, `const { NEXT_PUBLIC_FOO } = process.env` won't work correctly.

// Note that only `NEXT_PUBLIC_*` vars are affected; others can be used through `process.env.FOO` without issues.

export const VERCEL_URL = process.env["NEXT_PUBLIC_VERCEL_URL"];
