/* eslint-disable react-hooks/rules-of-hooks */
import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";
import Image from "next/image";

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
    const { frontMatter } = useConfig();
    const url = `https://squiggle-language.com${asPath}`;

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={frontMatter.title || "Squiggle"} />
        <meta
          property="og:description"
          content={
            frontMatter.description ||
            "A simple programming language for intuitive probabilistic estimation"
          }
        />
      </>
    );
  },
  footer: {
    text: <Footer />,
  },
  // squiggle components are not compatible with dark mode yet, see https://github.com/quantified-uncertainty/squiggle/issues/1192
  darkMode: false,
  primaryHue: 17,
  docsRepositoryBase:
    "https://github.com/quantified-uncertainty/squiggle/blob/develop/packages/website",
};

export default config;
