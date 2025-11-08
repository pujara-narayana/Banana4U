const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
// Load environment variables from .env for build-time injection
require("dotenv").config();

module.exports = {
  target: "electron-renderer",
  entry: "./renderer/src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist/renderer"),
    filename: "renderer.js",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/images/[name][ext]",
        },
      },
      {
        test: /\.(mp3|wav|ogg)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/sounds/[name][ext]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "renderer/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./renderer/public/index.html",
    }),
    // Only inject vars we explicitly need; let webpack set NODE_ENV based on --mode to avoid conflicts.
    new webpack.DefinePlugin({
      global: "window",
      "process.env.GEMINI_API_KEY": JSON.stringify(
        process.env.GEMINI_API_KEY || ""
      ),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    static: {
      directory: path.join(__dirname, "renderer/public"),
    },
  },
};
