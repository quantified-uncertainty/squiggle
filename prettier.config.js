module.exports = {
  trailingComma: "es5",
  overrides: [
    {
      files: ["tsconfig.json", "language-configuration.json"],
      options: {
        parser: "jsonc",
      },
    },
  ],
};
