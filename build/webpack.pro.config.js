const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const sentrySourceMap = !!process.env.sourcemap || false;
const SecSDK = require('warden-for-js').WardenPlugin;

const config = {
  mode: 'production',
  devtool: sentrySourceMap ? 'hidden-source-map' : false,
  performance: {
    maxEntrypointSize: 2500000,
    maxAssetSize: 2500000,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify('PRO'),
    }),
    true &&
      new SecSDK({
        dev: false,
      }),
  ].filter(Boolean),

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // Each Terser worker holds its own copy of the bundle; on GitHub's
        // 16 GB runners the default (cpus - 1) gets the job OOM-killed.
        parallel: process.env.CI ? 1 : true,
        terserOptions: {
          compress: {
            pure_funcs: ['console.log', 'console.debug', 'console.info'],
          },
        },
      }),
    ],
  },
};

module.exports = config;
