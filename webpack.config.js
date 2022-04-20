const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

const buildMode = process.env.NODE_ENV === "production" ? "production" : "development"

module.exports = {
  mode: buildMode,
  entry: "./src/main.ts",
  output: {
    path: `${__dirname}/dist`,
    filename: "[contenthash].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader"
      },
      {
        test: /\.(png|jpe?g|gif|mp4|glb)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: [
          "raw-loader",
        ]
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          "css-loader?modules=local",
          "sass-loader",
        ]
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./index.html"),
      filename: "index.html",
    })
  ],
  devServer: {
    compress: false,
    host: "0.0.0.0",
    port: 3000,
  },
};