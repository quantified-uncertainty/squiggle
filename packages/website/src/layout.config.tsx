import { type HomeLayoutProps } from "fumadocs-ui/layouts/home";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: HomeLayoutProps = {
  disableThemeSwitch: true,
  nav: {
    title: (
      <div className="flex gap-2 text-base">
        <Image
          src="/img/squiggle-logo.png"
          width={24}
          height={24}
          alt="Squiggle logo"
        />
        <span style={{ color: "#cd5835" }} className="font-lato font-bold">
          Squiggle
        </span>
      </div>
    ),
  },
  githubUrl: "https://github.com/quantified-uncertainty/squiggle",
  links: [
    {
      text: "Documentation",
      url: "/docs",
      active: "nested-url",
    },
    {
      text: "Playground",
      url: "/playground",
    },
    {
      text: "Squiggle Hub",
      url: "https://squigglehub.org",
    },
  ],
};
