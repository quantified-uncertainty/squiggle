import { FC, PropsWithChildren } from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { UserControls } from "./UserControls";

const TopMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border-slate-200 border-b h-16 flex items-center justify-between px-4">
      <Link href="/">
        <div className="flex items-center text-lg font-bold py-2 text-slate-500 cursor-pointer">
          Squiggle Hub
        </div>
      </Link>
      <UserControls session={session} />
    </div>
  );
};

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      <TopMenu />
      <div>{children}</div>
    </div>
  );
};
