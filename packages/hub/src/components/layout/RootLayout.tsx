import { FC, PropsWithChildren } from "react";
import { DropdownMenu, Dropdown, DropdownMenuActionItem } from "@quri/ui";
import {
  TriangleIcon,
  CodeBracketIcon,
  ScaleIcon,
  BookOpenIcon,
} from "@quri/ui";
import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { newDefinitionRoute, newModelRoute } from "@/routes";
import { UserControls } from "./UserControls";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

const NewDropdown: FC = () => {
  const router = useRouter();
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <DropdownMenuActionItem
            onClick={() => router.push(newModelRoute())}
            icon={CodeBracketIcon}
            title={"New Model"}
          />
          <DropdownMenuActionItem
            onClick={() => router.push(newDefinitionRoute())}
            icon={ScaleIcon}
            title={"New Definition"}
          />
        </DropdownMenu>
      )}
    >
      <div className="flex items-center text-white cursor-pointer hover:bg-slate-700 px-2 py-1 rounded-md select-none text-sm">
        New
        <TriangleIcon size={6} className={"rotate-180 ml-2 text-slate-300"} />
      </div>
    </Dropdown>
  );
};

const TopMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border-slate-200 h-10 flex items-center justify-between px-4 bg-gray-800">
      <div className="flex gap-6 items-baseline">
        <Link
          className="text-white hover:text-slate-300 font-semibold"
          href="/"
        >
          Squiggle Hub
        </Link>
      </div>
      <div className="flex gap-6 items-baseline">
        <Link
          className="text-white text-sm hover:bg-slate-700 px-2 py-1 rounded-md select-none"
          href="https://www.squiggle-language.com/docs/Api/Dist"
        >
          <BookOpenIcon
            className="inline-block mr-1 text-slate-400"
            size={14}
          />
          Docs
        </Link>
        {session && <NewDropdown />}
        <UserControls session={session} />
      </div>
    </div>
  );
};

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <TopMenu />
        <div>{children}</div>
      </div>
      <div className="p-8 border-t border-t-slate-200 bg-slate-100">
        <div className="text-sm text-slate-500">
          By{" "}
          <a
            href="https://quantifieduncertainty.org"
            className="text-blue-500 hover:underline"
          >
            QURI
          </a>
        </div>
      </div>
    </div>
  );
};
