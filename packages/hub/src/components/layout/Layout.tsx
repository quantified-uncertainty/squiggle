import { FC, PropsWithChildren } from "react";

import { useSession } from "next-auth/react";
import { UserControls } from "./UserControls";
import Link from "next/link";

const TopMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border border-b h-16 flex items-center justify-between px-4">
      <Link href="/">
        <div className="flex items-center text-lg font-bold py-2 text-slate-500 cursor-pointer">
          {/* <ScaleIcon
            className="fill-slate-500 mr-3 opacity-50"
            size={24}
            viewBox={"0 0 25 25"}
          /> */}
          Squiggle Hub
        </div>
      </Link>
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
