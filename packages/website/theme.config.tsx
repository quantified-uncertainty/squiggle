/* eslint-disable react-hooks/rules-of-hooks */
import Image from "next/image";
import { useRouter } from "next/router";
import { DocsThemeConfig, useConfig } from "nextra-theme-docs";

import { Footer } from "./src/components/Footer";

export default {
  logo: (
    <div className="flex gap-2">
      <Image
        src="/img/squiggle-logo.png"
        width={24}
        height={24}
        alt="Squiggle logo"
      />
      <span style={{ color: "#cd5835" }} className="font-lato font-black">
        Squiggle
      </span>
    </div>
  ),
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
