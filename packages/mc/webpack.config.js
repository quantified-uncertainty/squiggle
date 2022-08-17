const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const dist = path.resolve(__dirname, "dist");
const static = path.resolve(__dirname, "static");

module.exports = {
  mode: "development",
  entry: "./ts/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: dist,
    filename: "[name].js",
  },
  plugins: [
    new WasmPackPlugin({
      crateDirectory: __dirname,
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  experiments: {
    asyncWebAssembly: true,
  },
  devServer: {
    static: {
      directory: static,
      watch: true,
    },
  },
};
