const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    os: require.resolve('os-browserify/browser'),
    path: require.resolve('path-browserify'),
    process: require.resolve('process/browser'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/')
  };
  
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  );
  
  return config;
};