import { FC } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { BookOpenIcon, CodeBracketIcon } from "@quri/ui";

import { UserControls } from "./UserControls";
import { PageMenuLink } from "./PageMenuLink";
import { aboutRoute, newModelRoute } from "@/routes";
import { SQUIGGLE_DOCS_URL } from "@/lib/common";
import { FaPlus } from "react-icons/fa";

export const PageMenu: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="border-slate-200 h-10 flex items-center justify-between px-8 bg-gray-800">
      <div className="flex gap-6 items-baseline">
        <Link
          className="text-slate-300 hover:text-slate-300 font-semibold"
          href="/"
        >
          Squiggle Hub
        </Link>
      </div>
      <div className="flex gap-6 items-baseline">
        {!session && <PageMenuLink href={aboutRoute()} title="About" />}
        <PageMenuLink
          href={SQUIGGLE_DOCS_URL}
          icon={BookOpenIcon}
          title="Docs"
          external
        />
        {session && (
          <PageMenuLink
            href={newModelRoute()}
            icon={FaPlus}
            title="New Model"
          />
        )}
        <UserControls session={session} />
      </div>
    </div>
  );
};
