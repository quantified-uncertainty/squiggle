import { createMDX } from "fumadocs-mdx/next";

// `createMDX` recompiles MDX docs based on `./source.config.ts`.
// See https://fumadocs.vercel.app/docs/mdx/plugin for details.
// Note: it enables turbopack by default.
export default createMDX()({
  reactStrictMode: true,
  async redirects() {
    return [
      // permanent redirects might be cached forever which is scary, let's use 307 for now
      { source: "/docs/Overview", destination: "/docs", permanent: false },
      {
        source: "/docs/Api/DistSampleSet",
        destination: "/docs/Api/SampleSet",
        permanent: false,
      },
      {
        source: "/docs/Api/DistPointSet",
        destination: "/docs/Api/PointSet",
        permanent: false,
      },
      {
        source: "/docs/Api/Dictionary",
        destination: "/docs/Api/Dict",
        permanent: false,
      },
    ];
  },
});
