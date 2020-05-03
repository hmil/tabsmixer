const path = require('path')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    entry: {
        popup: './src/entry/popup.ts',
        background: './src/entry/background.ts',
        content: './src/entry/content.ts'
    },
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /agent\.ts$/i,
                use: [
                    {
                        loader: 'raw-loader',
                        options: {
                            esModule: false,
                        },
                    },
                ],
            }, {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.json"
                    }
                }],
                exclude: [ /node_modules/ ]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin()
        ]
    },
    externals: {
        'webmidi': 'WebMidi'
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {

                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
}
