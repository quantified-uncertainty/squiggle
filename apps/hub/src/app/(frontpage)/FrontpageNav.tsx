"use client";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { GlobeIcon } from "@quri/ui";

import {
  PageManuDesktopHeader,
  PageMenu,
  PageMenuLink,
  PageMenuSubheader,
} from "@/components/ui/PageMenu";
import {
  definitionsRoute,
  epistemicAgentsRoute,
  evaluationsRoute,
  groupsRoute,
  questionSetsRoute,
  variablesRoute,
} from "@/lib/routes";

const MobileNavHeaderText: FC = () => {
  const pathname = usePathname();

  switch (pathname) {
    case "/":
      return "Models";
    case variablesRoute():
      return "Variables";
    case definitionsRoute():
      return "Definitions";
    case groupsRoute():
      return "Groups";
    case evaluationsRoute():
      return "Evals";
    case questionSetsRoute():
      return "Question Sets";
    case epistemicAgentsRoute():
      return "Epistemic Agents";
    default:
      return null;
  }
};

const MobileNavHeader: FC = () => {
  return (
    <div className="text-sm font-medium text-slate-600">
      <MobileNavHeaderText />
    </div>
  );
};

export const FrontpageNav: FC = () => {
  return (
    <PageMenu
      mobileHeader={<MobileNavHeader />}
      desktopHeader={
        <PageManuDesktopHeader icon={GlobeIcon} title="All Entities" />
      }
    >
      <PageMenuLink name="Models" href="/" />
      <PageMenuLink name="Variables" href={variablesRoute()} />
      <PageMenuLink name="Definitions" href={definitionsRoute()} />
      <PageMenuLink name="Groups" href={groupsRoute()} />
      <PageMenuSubheader>Experimental</PageMenuSubheader>
      <PageMenuLink name="Question Sets" href={questionSetsRoute()} />
      <PageMenuLink name="Evals" href={evaluationsRoute()} />
      <PageMenuLink name="Epistemic Agents" href={epistemicAgentsRoute()} />
    </PageMenu>
  );
};
