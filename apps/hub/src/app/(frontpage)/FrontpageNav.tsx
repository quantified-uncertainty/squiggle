"use client";
import { FC } from "react";

import {
  PageMenu,
  PageMenuLink,
  PageMenuSeparator,
} from "@/components/ui/PageMenu";
import {
  definitionsRoute,
  evaluationsRoute,
  groupsRoute,
  questionSetsRoute,
  variablesRoute,
} from "@/lib/routes";

export const FrontpageNav: FC = () => {
  return (
    <PageMenu>
      <PageMenuLink name="Models" href="/" />
      <PageMenuLink name="Variables" href={variablesRoute()} />
      <PageMenuLink name="Definitions" href={definitionsRoute()} />
      <PageMenuLink name="Groups" href={groupsRoute()} />
      <PageMenuSeparator />
      <PageMenuLink name="Evals" href={evaluationsRoute()} />
      <PageMenuLink name="Question Sets" href={questionSetsRoute()} />
    </PageMenu>
  );
};
