/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    runtime: "nodejs",
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
