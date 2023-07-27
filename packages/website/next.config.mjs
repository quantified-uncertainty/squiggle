import nextra from "nextra";

import fs from "fs";
import { BUNDLED_LANGUAGES, getHighlighter } from "shiki";

const grammar = fs.readFileSync(
  "../textmate-grammar/dist/squiggle.tmLanguage.json",
  "utf-8"
);

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
          grammar: JSON.parse(grammar),
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

export default withNextra();
