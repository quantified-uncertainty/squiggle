import { FC, PropsWithChildren } from "react";

import { UserControls } from "./UserControls";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

async function TopMenu() {
  const session = await getServerSession(authOptions); // gets session from db or cookie

  return (
    <div className="border border-b h-16 flex items-center justify-end px-4">
      <UserControls session={session} />
    </div>
  );
}

export const App: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="squiggle-hub">
      {/* waiting for Typescript 5.1; https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#decoupled-type-checking-between-jsx-elements-and-jsx-tag-types */}
      {/* @ts-expect-error Async Server Component */}
      <TopMenu />
      <div>{children}</div>
    </div>
  );
};
