// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const math = require("remark-math");
const katex = require("rehype-katex");

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Squiggle",
  tagline:
    "A simple programming language for intuitive probabilistic estimation",
  url: "https://squiggle-language.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "quantified-uncertainty", // Usually your GitHub org/user name.
  projectName: "squiggle", // Usually your repo name.
  plugins: [],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl:
            "https://github.com/quantified-uncertainty/squiggle/tree/develop/packages/website/",
          remarkPlugins: [math],
          rehypePlugins: [katex],
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            "https://github.com/quantified-uncertainty/squiggle/tree/develop/packages/website/",
        },
        theme: {
          customCss: [
            require.resolve("./src/css/custom.css"),
            require.resolve("@quri/squiggle-components/dist/main.css"),
          ],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // TODO - disabled until we fix algolia search
      // algolia: {
      //   // The application ID provided by Algolia
      //   appId: "KBED3M1CMD",

      //   // Public API key: it is safe to commit it
      //   apiKey: "c61bc7603893cf287ed6971983af8bad",

      //   indexName: "squiggle_docs",

      //   // Optional: see doc section below
      //   contextualSearch: true,

      //   // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      //   // externalUrlRegex: 'external\\.com|domain\\.com',

      //   // Optional: Algolia search parameters
      //   searchParameters: {},

      //   // Optional: path for search page that enabled by default (`false` to disable it)
      //   searchPagePath: "search",

      //   //... other Algolia params
      // },
      colorMode: {
        // squiggle playground is not compatible with dark mode yet, see https://github.com/quantified-uncertainty/squiggle/issues/1192
        disableSwitch: true,
      },
      navbar: {
        title: "Squiggle",
        hideOnScroll: true,
        logo: {
          alt: "Squiggle Logo",
          src: "img/squiggle-logo.png",
        },
        items: [
          {
            type: "doc",
            docId: "Overview",
            position: "left",
            label: "Documentation",
          },
          {
            type: "doc",
            docId: "Api/Dist",
            position: "left",
            label: "API",
          },
          { to: "/blog", label: "Blog", position: "left" },
          { to: "/playground", label: "Playground", position: "left" },
          {
            href: "https://github.com/quantified-uncertainty/squiggle/discussions",
            label: "Issues & Discussion",
            position: "right",
          },
          {
            href: "https://github.com/quantified-uncertainty/squiggle",
            label: "GitHub",
            position: "right",
          },
          {
            href: "https://quantifieduncertainty.org/",
            label: "QURI",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "GitHub",
                href: "https://github.com/quantified-uncertainty/squiggle",
              },
            ],
          },
        ],
        copyright: `CC0. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  stylesheets: [
    {
      href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
      type: "text/css",
      integrity:
        "sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
      crossorigin: "anonymous",
    },
  ],
};

module.exports = config;
