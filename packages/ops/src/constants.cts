// This file is .cts because changeset changelog functions need to be in CJS.

export const REPO = "quantified-uncertainty/squiggle";

export const WEBSITE_CHANGELOG_ROOT =
  "packages/website/src/pages/docs/Changelog";

// Versions of all these packages should be synced thanks to `fixed` field in `.changeset/config.json`.
// TODO - extract from changeset config.
export const PRIMARY_SQUIGGLE_PACKAGE_DIRS = [
  "packages/squiggle-lang",
  "packages/components",
  "packages/prettier-plugin",
  "packages/textmate-grammar",
  "packages/vscode-ext",
];

export const VSCODE_PACKAGE_NAME = "vscode-squiggle";

export const VSCODE_EXTENSION_URL =
  "https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle";
