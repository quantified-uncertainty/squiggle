import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import "@quri/squiggle-components/common.css";
import "react-loading-skeleton/dist/skeleton.css";

import "@/styles/main.css";

import { ClientApp } from "./ClientApp";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function RootLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  return (
    <html>
      <body>
        <ClientApp session={session}>
          <ErrorBoundary>{children}</ErrorBoundary>
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
