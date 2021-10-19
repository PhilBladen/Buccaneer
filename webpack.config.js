const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const HtmlWebpackLiveReload = require('html-webpack-live-reload-plugin');
const isDevelopment = process.env.NODE_ENV !== 'production';
const webpack = require("webpack");
const chokidar = require("chokidar");

module.exports = {
  mode: 'development',
  entry: "./src/index.js",
  devServer: {
    port: 8081,
    static: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
    "babylonjs": path.resolve(__dirname, 'node_modules/babylonjs/babylon.max.js'),
    "babylonjs-loaders": path.resolve(__dirname, 'node_modules/babylonjs-loaders/babylonjs.loaders.js'),
    "babylonjs-inspector": path.resolve(__dirname, 'node_modules/babylonjs-inspector/babylon.inspector.bundle.max.js')
    },
    fallback: {
      util: require.resolve("util/")
    }
  }
};
