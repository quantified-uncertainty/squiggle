import { FC, Suspense } from "react";

import {
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
import { auth } from "@/lib/server/auth";
import { isAdminUser } from "@/users/auth";

import { FrontpageNavDesktopHeader } from "./FrontpageNavDesktopHeader";
import { MobileFrontpageNavHeaderText } from "./MobileFrontpageNavHeaderText";

const MobileFrontpageNavHeader: FC = () => {
  return (
    <div className="text-sm font-medium text-slate-600">
      <MobileFrontpageNavHeaderText />
    </div>
  );
};

const FrontpageNavEvalsIfRoot: FC = async () => {
  const session = await auth();
  if (!session || !isAdminUser(session.user)) {
    return null;
  }

  return (
    <>
      <PageMenuSubheader>Evals</PageMenuSubheader>
      <PageMenuLink name="Question Sets" href={questionSetsRoute()} />
      <PageMenuLink name="Evaluations" href={evaluationsRoute()} />
      <PageMenuLink name="Epistemic Agents" href={epistemicAgentsRoute()} />
    </>
  );
};

export const FrontpageNav: FC = () => {
  return (
    <PageMenu
      mobileHeader={<MobileFrontpageNavHeader />}
      desktopHeader={<FrontpageNavDesktopHeader />}
    >
      <PageMenuLink name="Models" href="/" />
      <PageMenuLink name="Variables" href={variablesRoute()} />
      <PageMenuLink name="Groups" href={groupsRoute()} />
      <PageMenuSubheader>Experimental</PageMenuSubheader>
      <PageMenuLink name="Definitions" href={definitionsRoute()} />
      <Suspense>
        <FrontpageNavEvalsIfRoot />
      </Suspense>
    </PageMenu>
  );
};
