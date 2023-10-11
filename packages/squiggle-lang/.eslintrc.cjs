module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "no-constant-condition": ["error", { checkLoops: false }],
    // "multiline-comment-style": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],
    "@typescript-eslint/no-empty-function": [
      "error",
      { allow: ["constructors"] },
    ],
    "@typescript-eslint/no-this-alias": "off",
    // Maybe this should be "warn", but there are a few legitimate cases where typing is too hard,
    // and zero-warning eslint output is nice to have.
    "@typescript-eslint/no-explicit-any": "off",
  },
};
