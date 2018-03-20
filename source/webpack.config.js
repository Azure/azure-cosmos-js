var path = require("path");
var webpack = require("webpack");

module.exports = {
    entry: "./index.js",
    node: {
        net: "mock",
        tls: "mock"
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({})
    ],
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        library: "documentDBClient"
    }
};