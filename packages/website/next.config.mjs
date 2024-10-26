import { withContentCollections } from "@content-collections/next";

// See https://fumadocs.vercel.app/docs/headless/content-collections for docs.
export default withContentCollections({
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
