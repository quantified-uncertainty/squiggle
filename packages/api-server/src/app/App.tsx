import { signIn, signOut, useSession } from "next-auth/react";
import { FC, PropsWithChildren } from "react";

import { Button } from "@/components/ui/Button";

const TopMenu: FC = () => {
  const session = useSession();

  return (
    <div className="border border-b h-16 flex items-center justify-end px-4">
      {!session.status || session.status === "loading" ? null : session.data ? (
        <div className="flex items-center gap-2">
          <div>{session.data.user?.email}</div>
          <Button onClick={() => signOut()}>Sign Out</Button>
        </div>
      ) : (
        <Button onClick={() => signIn()}>Sign In</Button>
      )}
    </div>
  );
};

export const App: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="squiggle-hub">
      <TopMenu />
      <div>{children}</div>
    </div>
  );
};
