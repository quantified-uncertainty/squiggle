import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    runtime: "nodejs",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
  redirects: async () => [
    {
      source: "/playground",
      destination: "https://squiggle-language.com/playground",
      permanent: false, // we might host the playground on squiggle hub in the future
    },
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
