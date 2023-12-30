import nextra from "nextra";
import { BUNDLED_LANGUAGES, getHighlighter } from "shiki";

import squiggleGrammar from "@quri/squiggle-textmate-grammar/dist/squiggle.tmLanguage.json" assert { type: "json" };

// not documented in nextra yet, but explained here: https://github.com/shuding/nextra/issues/555
const rehypePrettyCodeOptions = {
  getHighlighter: (options) => {
    return getHighlighter({
      ...options,
      langs: [
        ...BUNDLED_LANGUAGES,
        {
          id: "squiggle",
          scopeName: "source.squiggle",
          grammar: squiggleGrammar,
        },
      ],
    });
  },
};

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  mdxOptions: { rehypePrettyCodeOptions },
  latex: true,
});

export default withNextra({
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
