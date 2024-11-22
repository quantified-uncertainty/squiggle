import "@quri/squiggle-components/common.css";
import "react-loading-skeleton/dist/skeleton.css";
import "@/styles/main.css";

import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { auth } from "@/auth";

import { RootLayout } from "./RootLayout";

export default async function ServerRootLayout({
  children,
}: PropsWithChildren) {
  const session = await auth();

  return (
    <html>
      <body>
        <RootLayout session={session}>{children}</RootLayout>
        <Analytics />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    absolute: "Squiggle Hub",
    template: "%s | Squiggle Hub",
  },
};
