const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sass = require('sass');

module.exports = [{
  mode: 'production',
  target: ['web', 'es5'],
  stats: {
    errorDetails: true,
  },
  entry: {
    all: [
      path.resolve(__dirname, 'assets/javascripts/index.js'),
      path.resolve(__dirname, 'assets/scss/all.scss'),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'app/public'),
    filename: 'javascripts/[name]-min.js',
    clean: true,
  },
  module: {
    rules: [{
      test: /\.scss$/i,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            url: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: sass,
            sourceMap: true,
          },
        },
      ],
    }],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
  ],
}];
