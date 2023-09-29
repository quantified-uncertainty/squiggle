import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import "@quri/squiggle-components/common.css";
import "react-loading-skeleton/dist/skeleton.css";

import "@/styles/main.css";

import QueryNode, {
  RootLayoutQuery,
} from "@/__generated__/RootLayoutQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { RootLayout } from "./RootLayout";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";

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
        <RootLayout session={session} query={query}>
          {children}
        </RootLayout>
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
