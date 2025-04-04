import "katex/dist/katex.css";
import "@quri/squiggle-components/common.css";
import "../styles/main.css";

import { Analytics } from "@vercel/analytics/react";
import { RootProvider } from "fumadocs-ui/provider";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    // `suppressHydrationWarning` is required by fumadocs, recommended by docs and default generated examples
    // Fumadocs injects "light theme" styles on HTML element.
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider
          theme={{
            // squiggle components are not compatible with dark mode yet, see
            // https://github.com/quantified-uncertainty/squiggle/issues/1192
            // see also: `disableThemeSwitch` in `layout.config.tsx`
            forcedTheme: "light",
          }}
        >
          {children}
        </RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
