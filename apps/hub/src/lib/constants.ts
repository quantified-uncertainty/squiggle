// for format() from date-fns
export const commonDateFormat = "MMM d yyyy, H:mm";

// Footer links, etc.
export const DISCORD_URL = "https://discord.gg/nsTnQTgtG6";
export const GITHUB_URL = "https://github.com/quantified-uncertainty/squiggle";
export const GITHUB_DISCUSSION_URL =
  "https://github.com/quantified-uncertainty/squiggle/discussions";
export const NEWSLETTER_URL = "https://quri.substack.com/t/squiggle";

export const QURI_DONATE_URL = "https://quantifieduncertainty.org/donate";
export const SQUIGGLE_DOCS_URL =
  "https://www.squiggle-language.com/docs/Api/Dist";

// Don't try to destructure this, `const { NEXT_PUBLIC_FOO } = process.env` won't work correctly.
// Note that only `NEXT_PUBLIC_*` vars are affected; others can be used through `process.env.FOO` without issues.
export const VERCEL_URL = process.env["NEXT_PUBLIC_VERCEL_BRANCH_URL"];

// Squiggle defaults
export const SAMPLE_COUNT_DEFAULT = 1000;
export const XY_POINT_LENGTH_DEFAULT = 1000;

export const DEFAULT_SEED = "DEFAULT_SEED";
