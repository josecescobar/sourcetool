import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default (env: { target?: string }, argv: { mode?: string }) => {
  const target = env.target || 'chrome';
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'inline-source-map',
    entry: {
      background: './src/background/index.ts',
      content: './src/content/index.ts',
      sidepanel: './src/sidepanel/index.tsx',
      popup: './src/popup/index.tsx',
      options: './src/options/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, `dist/${target}`),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new CopyPlugin({
        patterns: [
          { from: `manifests/${target}.json`, to: 'manifest.json' },
          { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/sidepanel/index.html',
        filename: 'sidepanel.html',
        chunks: ['sidepanel'],
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/index.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        template: './src/options/index.html',
        filename: 'options.html',
        chunks: ['options'],
      }),
    ],
  };
};
