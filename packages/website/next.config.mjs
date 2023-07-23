import nextra from "nextra";

import fs from 'fs';

const grammar = fs.readFileSync("../vscode-ext/syntaxes/squiggle.tmLanguage.json", 'utf-8');


import { getHighlighter, BUNDLED_LANGUAGES } from "shiki";

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
  themeConfig: "./theme.config.jsx",
  mdxOptions: { rehypePrettyCodeOptions },
  latex: true,
});

export default withNextra();
