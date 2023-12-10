import "@quri/squiggle-components/common.css";
import "react-loading-skeleton/dist/skeleton.css";
import "@/styles/main.css";

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import { authOptions } from "./api/auth/[...nextauth]/authOptions";
import { RootLayout } from "./RootLayout";

export default async function ServerRootLayout({
  children,
}: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  return (
    <html>
      <body>
        <RootLayout session={session}>{children}</RootLayout>
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
