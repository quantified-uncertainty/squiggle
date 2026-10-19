const scope = require("./postcss-scope.cjs");

// `styles.css` is the scoped stylesheet (everything is prefixed with
// `.squiggle-rv`); other files (`full.css`, Storybook) are built as is.
module.exports = (ctx) => {
  const scoped = ctx.file?.basename === "styles.css";
  return {
    plugins: [
      require("postcss-import"),
      require("tailwindcss"),
      ...(scoped ? [scope({ scope: "squiggle-rv" })] : []),
      require("autoprefixer"),
    ],
  };
};
