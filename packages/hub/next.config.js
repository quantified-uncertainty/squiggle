const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const withOptimizedImages = require('next-optimized-images');

module.exports = withPlugins(
  [
    [
      withImages,
      {
        inlineImageLimit: -1,
      },
    ],
    [
      withOptimizedImages,
      {
        optimizeImagesInDev: true,
      },
    ],
  ],
  {
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

      return config;
    },
  }
);
