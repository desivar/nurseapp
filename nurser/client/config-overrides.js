const path = require('path');

module.exports = function override(config) {
  config.resolve.fallback = {
    path: require.resolve('path-browserify'),
    fs: false,
    crypto: false
  };
  return config;
};