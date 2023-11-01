module.exports = {
  webpack: (config, { dev, isServer }) => {
    config.optimization.splitChunks = {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          test: /[\\/]src[\\/]/,
          name: 'common',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
