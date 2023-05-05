import { FC, PropsWithChildren } from "react";

import { useSession } from "next-auth/react";
import { UserControls } from "./UserControls";

const TopMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border border-b h-16 flex items-center justify-end px-4">
      <UserControls session={session} />
    </div>
  );
};

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <TopMenu />
      <div>{children}</div>
    </div>
  );
};
