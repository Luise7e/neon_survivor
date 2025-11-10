const path = require('path');

module.exports = {
  entry: './src/pixi-bundle.js',
  output: {
    filename: 'pixi-bundle.dist.js',
    path: path.resolve(__dirname, 'app/src/main/assets/dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  mode: 'production',
};