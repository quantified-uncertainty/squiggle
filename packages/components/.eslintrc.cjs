module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "@wogns3623/better-exhaustive-deps"],
  rules: {
    // Replace exhaustive-deps hook with a better fork
    // Context: https://github.com/facebook/react/issues/16873
    "react-hooks/exhaustive-deps": "off",
    "@wogns3623/better-exhaustive-deps/exhaustive-deps": [
      "warn",
      {
        checkMemoizedVariableIsStatic: true,
        staticHooks: {
          useLazyRef: true,
        },
      },
    ],
    "no-constant-condition": [
      "error",
      {
        checkLoops: false,
      },
    ],
    "no-console": "warn",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: ["**/*.stories.*", "src/index.ts"],
      rules: {
        "import/no-anonymous-default-export": "off",
      },
    },
  ],
};
