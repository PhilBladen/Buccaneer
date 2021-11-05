const path = require("path")
const webpack = require("webpack")
const HtmlWebPackPlugin = require("html-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin")
const smp = new SpeedMeasurePlugin()

const outputDirectory = "../dist";
const devMode = process.env.NODE_ENV === 'development';

module.exports = smp.wrap({
    mode: "development",
    target: "web",
    devtool: "inline-source-map",
    entry: "./src/client/ts/index.ts",
    output: {
        path: path.join(__dirname, outputDirectory),
        filename: "bundle.js",
        clean: true,
    },
    // optimization: {
    //     // usedExports: true,
    //     splitChunks: {
    //         chunks: 'all',
    //     },
    // },
    devServer: {
        static: '../src/client/html',
        port: 8081,
        static: path.resolve(__dirname, outputDirectory),
    },
    // output: {
    //     path: path.resolve(__dirname, 'dist'),
    //     filename: '[name].[contenthash].js',
    // },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(scss|css)$/,
                exclude: /node_modules/,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: false,
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.html$/i,
                use: [
                    {
                        loader: "html-loader",
                        options: {
                            minimize: !devMode,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
        // alias: {
        //     // "babylonjs": path.resolve(__dirname, 'node_modules/babylonjs/babylon.max.js'),
        //     // "babylonjs-loaders": path.resolve(__dirname, 'node_modules/babylonjs-loaders/babylonjs.loaders.js'),
        //     // "babylonjs-inspector": path.resolve(__dirname, 'node_modules/babylonjs-inspector/babylon.inspector.bundle.max.js')
        // },
        // fallback: {
        //     // util: require.resolve("util/")
        // }
    },
    plugins: [
        new webpack.DefinePlugin({
            DISABLE_LOADING_SCREEN: true,
        }),
        new HtmlWebPackPlugin({
            template: "./src/client/html/index.html",
            // filename: "./index.html",
            excludeChunks: ["server"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "../src/client/assets"),
                    to: "assets",
                },
            ],
        }),
    ],
})
