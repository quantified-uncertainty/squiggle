/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    relay: {
      // This should match relay.config.js
      src: "./src",
      language: "typescript",
      artifactDirectory: "./src/__generated__",
      eagerEsModules: false,
    },
  },
  redirects: async () => [
    {
      source: "/users/:username/models/:slug*",
      destination: "/models/:username/:slug*",
      permanent: true,
    },
    {
      source: "/users/:username/relative-values/:slug*",
      destination: "/relative-values/:username/:slug*",
      permanent: true,
    },
  ],
};

export default nextConfig;
