module.exports = {
  trailingComma: "es5",
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["tsconfig.json", "language-configuration.json"],
      options: {
        parser: "jsonc",
      },
    },
  ],
};
