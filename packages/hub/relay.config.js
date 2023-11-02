module.exports = {
  src: "./src",
  language: "typescript",
  artifactDirectory: "./src/__generated__",
  schema: "./schema.graphql",
  // https://github.com/facebook/relay/releases/tag/v16.0.0
  typescriptExcludeUndefinedFromNullableUnion: true,
  exclude: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
};
