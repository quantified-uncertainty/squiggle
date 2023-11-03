import * as path from "path";

import * as url from "url";

import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const config = {
  mode: "production",
  devtool: "source-map",
  profile: true,
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: { projectReferences: true },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
      ".js": [".js", ".ts", ".tsx"],
    },
    alias: {
      "@quri/squiggle-lang": path.resolve(__dirname, "../squiggle-lang/src"),
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    chunkFilename: '[name].[chunkhash].js',
    library: {
      name: "squiggle_components",
      type: "umd",
    },
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  devServer: {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: { 
          projectReferences: true,
          transpileOnly: true,
          experimentalWatchApi: true,
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
      ".js": [".js", ".ts", ".tsx"],
    },
    alias: {
      "@quri/squiggle-lang": path.resolve(__dirname, "../squiggle-lang/src"),
    },
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "squiggle_components",
      type: "umd",
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    port: 9000,
  },
  externals: {
    react: {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React",
    },
    "react-dom": {
      commonjs: "react-dom",
      commonjs2: "react-dom",
      amd: "react-dom",
      root: "ReactDOM",
    },
  },
};

if (process.env.ANALYZE) {
  config.plugins = [...(config.plugins ?? []), new BundleAnalyzerPlugin()];
}

export default config;
performance: {
  hints: process.env.NODE_ENV === 'production' ? "warning" : false,
  maxEntrypointSize: 500000,
  maxAssetSize: 300000,
},
