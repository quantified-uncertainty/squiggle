const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/js/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: { buffer: ["@stdlib/buffer"] },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "squiggle_lang",
      type: "umd",
    },
  },
};
