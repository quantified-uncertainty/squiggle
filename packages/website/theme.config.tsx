import { useRouter } from "next/router";
import { DocsThemeConfig, useConfig } from "nextra-theme-docs";

import { Footer } from "./src/components/Footer";

export default {
  project: {
    link: "https://github.com/quantified-uncertainty/squiggle",
  },
  head: () => {
    const { asPath } = useRouter();
    const { title } = useConfig();

    const url = `https://squiggle-language.com${asPath}`;

    const fullTitle = asPath === "/" ? "Squiggle" : `${title} | Squiggle`;

    // Nextra automatically injects og:title and og:description.
    // og:title is based on _meta.json; og:description comes from frontmatter.
    return (
      <>
        <title>{fullTitle}</title>
        <meta property="og:title" content={title} />
        <meta property="og:url" content={url} />
      </>
    );
  },
  footer: {
    component: Footer,
  },
  // squiggle components are not compatible with dark mode yet, see https://github.com/quantified-uncertainty/squiggle/issues/1192
  darkMode: false,
  nextThemes: {
    forcedTheme: "light",
  },
  color: {
    hue: 17,
  },
  docsRepositoryBase:
    "https://github.com/quantified-uncertainty/squiggle/blob/main/packages/website",
} satisfies DocsThemeConfig;
