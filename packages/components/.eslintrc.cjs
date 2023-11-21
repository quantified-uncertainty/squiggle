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
  plugins: ["@typescript-eslint"],
  rules: {
    "no-constant-condition": [
      "error",
      {
        checkLoops: false,
      },
    ],
    "no-console": "warn",
    "@typescript-eslint/no-empty-function": "off",
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
