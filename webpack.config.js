const webpack = require('webpack')
const path = require('path')

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'src/assets/styles')]
              }
            }
          }
        ]
      },
      // {
      //   test: /\.png$/,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         includePaths: [
      //           path.resolve(__dirname, 'src/assets/image')
      //         ],
      //         mimetype: 'image/png'
      //       }
      //     }
      //   ]
      // }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      diff_match_patch: 'diff-match-patch',
      DIFF_EQUAL: ['diff-match-patch', 'DIFF_EQUAL'],
      DIFF_INSERT: ['diff-match-patch', 'DIFF_INSERT'],
      DIFF_DELETE: ['diff-match-patch', 'DIFF_DELETE']
    })
  ]
}

module.exports = config