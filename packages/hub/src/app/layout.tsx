import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import "@/styles/main.css";
import "@quri/squiggle-components/dist/main.css";

import { ClientApp } from "./ClientApp";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";

export default async function RootLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  return (
    <html>
      <body>
        <div className="squiggle-hub">
          <ClientApp session={session}>{children}</ClientApp>
        </div>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Squiggle Hub",
};
