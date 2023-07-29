/* eslint-disable react-hooks/rules-of-hooks */
import Image from "next/image";
import { useRouter } from "next/router";
import { DocsThemeConfig } from "nextra-theme-docs";

import { Footer } from "./src/components/Footer";

const config = {
  logo: (
    <div className="flex gap-2">
      <Image
        src="/img/squiggle-logo.png"
        width={24}
        height={24}
        alt="Squiggle logo"
      />
      <span style={{ color: "#cd5835" }} className="font-black font-lato">
        Squiggle
      </span>
    </div>
  ),
  project: {
    link: "https://github.com/quantified-uncertainty/squiggle",
  },
  useNextSeoProps() {
    const { asPath } = useRouter();
    return {
      titleTemplate: asPath === "/" ? "Squiggle" : "%s | Squiggle",
    };
  },
  head: () => {
    const { asPath } = useRouter();
    const url = `https://squiggle-language.com${asPath}`;

    // Nextra automatically injects og:title and og:description.
    // og:title is based on _meta.json; og:description comes from frontmatter.
    return (
      <>
        <meta property="og:url" content={url} />
      </>
    );
  },
  footer: {
    text: <Footer />,
  },
  // squiggle components are not compatible with dark mode yet, see https://github.com/quantified-uncertainty/squiggle/issues/1192
  darkMode: false,
  nextThemes: {
    forcedTheme: "light",
  },
  primaryHue: 17,
  docsRepositoryBase:
    "https://github.com/quantified-uncertainty/squiggle/blob/main/packages/website",
} satisfies DocsThemeConfig;

export default config;
