"use client";
import { usePathname } from "next/navigation";
import { FC } from "react";

import {
  definitionsRoute,
  epistemicAgentsRoute,
  evaluationsRoute,
  groupsRoute,
  questionSetsRoute,
  variablesRoute,
} from "@/lib/routes";

// separate file because this is a client component
export const MobileFrontpageNavHeaderText: FC = () => {
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
