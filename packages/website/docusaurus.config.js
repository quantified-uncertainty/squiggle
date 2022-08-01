// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const math = require("remark-math");
const katex = require("rehype-katex");

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const langPackageJson = require("../squiggle-lang/package.json");
const componentsPackageJson = require("../components/package.json");
const date = require("./date");

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
        logo: {
          alt: "QURI logo",
          src: "img/quri-logo-with-QURI-written-underneath.png",
          href: "https://quantifieduncertainty.org",
          width: 150,
          height: 150,
        },
        copyright: `Rescript language package v${langPackageJson.version} | React components package v${componentsPackageJson.version} | Built at ${date}`,
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
