const path = require('path');
const webpack = require('webpack');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
    mode: 'development',
    target: 'web',
    devtool: "inline-source-map",
    entry: "./src/index.ts",
    // optimization: {
    //     // usedExports: true,
    //     splitChunks: {
    //         chunks: 'all',
    //     },
    // },
    devServer: {
        port: 8081,
        static: path.resolve(__dirname, "dist"),
    },
    // output: {
    //     path: path.resolve(__dirname, 'dist'),
    //     filename: '[name].[contenthash].js',
    // },
    module: {
        rules: [{
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
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: false
                    }
                }],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
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
            DISABLE_LOADING_SCREEN: true
        }),
    ]
});