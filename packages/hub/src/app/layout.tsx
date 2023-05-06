import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import { ClientApp } from "./ClientApp";

import "@/styles/main.css";
import "@quri/squiggle-components/dist/main.css";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";

export default async function RootLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  return (
    <html>
      <head>
        <title>Squiggle Hub</title>
      </head>
      <body>
        <div className="squiggle-hub">
          <ClientApp session={session}>{children}</ClientApp>
        </div>
      </body>
    </html>
  );
}
