import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import "@quri/squiggle-components/common.css";
import "react-loading-skeleton/dist/skeleton.css";

import "@/styles/main.css";

import { ClientApp } from "./ClientApp";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";
import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  RootLayoutQuery,
} from "@/__generated__/RootLayoutQuery.graphql";
import { RootLayout } from "./RootLayout";

export default async function ServerRootLayout({
  children,
}: PropsWithChildren) {
  const session = await getServerSession(authOptions);
  const query = await loadPageQuery<RootLayoutQuery>(QueryNode, {
    signedIn: !!session,
  });

  return (
    <html>
      <body>
        <ClientApp session={session}>
          <RootLayout query={query}>{children}</RootLayout>
        </ClientApp>
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
