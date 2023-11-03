const NextConfig = {
  experimental: {
    reactLoadable: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups.commons.minSize = 0;
    }

    config.optimization.splitChunks.cacheGroups.lib = {
      test(module) {
        return module.size() > 160000;
      },
      name: 'lib',
      chunks: 'all',
      priority: 10,
      reuseExistingChunk: true,
      enforce: true,
    };

    config.performance = {
      maxAssetSize: 500000,
      maxEntrypointSize: 500000,
    };

    return config;
  },
};

module.exports = NextConfig;
