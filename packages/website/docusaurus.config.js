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
  tagline: "An estimation language for forecasters",
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
      navbar: {
        title: "Squiggle",
        logo: {
          alt: "Squiggle Logo",
          src: "img/quri-logo.png",
        },
        items: [
          {
            type: "doc",
            docId: "Introduction",
            position: "left",
            label: "Documentation",
          },
          {
            type: "doc",
            docId: "Api/DistGeneric",
            position: "left",
            label: "API",
          },
          { to: "/blog", label: "Blog", position: "left" },
          { to: "/playground", label: "Playground", position: "left" },
          {
            href: "https://github.com/quantified-uncertainty/squiggle",
            label: "GitHub",
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
