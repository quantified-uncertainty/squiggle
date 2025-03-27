"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { Link } from "@/components/ui/Link";
import {
  definitionsRoute,
  epistemicAgentsRoute,
  evaluationsRoute,
  groupsRoute,
  questionSetsRoute,
  variablesRoute,
} from "@/lib/routes";

const NavItem: FC<{ name: string; href: string }> = ({ name, href }) => {
  const pathname = usePathname();
  const isSelected = pathname === href;

  return (
    <Link href={href}>
      <div
        className={clsx(
          "group m-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors duration-75",
          isSelected ? "bg-blue-100" : "bg-white hover:bg-blue-100"
        )}
      >
        <div
          className={clsx(
            "flex-1 text-sm font-medium",
            isSelected
              ? "text-slate-900"
              : "text-slate-500 group-hover:text-slate-900"
          )}
        >
          {name}
        </div>
      </div>
    </Link>
  );
};

const Separator: FC = () => {
  return <div className="-mx-1 my-1 h-px bg-slate-200" />;
};

export const DesktopFrontpageNav: FC = () => {
  return (
    <div className="flex flex-col">
      <NavItem name="Models" href="/" />
      <NavItem name="Variables" href={variablesRoute()} />
      <NavItem name="Definitions" href={definitionsRoute()} />
      <NavItem name="Groups" href={groupsRoute()} />
      <Separator />
      <NavItem name="Evals" href={evaluationsRoute()} />
      <NavItem name="Question Sets" href={questionSetsRoute()} />
      <NavItem name="Epistemic Agents" href={epistemicAgentsRoute()} />
    </div>
  );
};
