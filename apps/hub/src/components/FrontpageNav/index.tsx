import { FC, Suspense } from "react";

import {
  BookOpenIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  GroupIcon,
  ScaleIcon,
  ShareIcon,
} from "@quri/ui";

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
      <PageMenuLink
        name="Question Sets"
        href={questionSetsRoute()}
        icon={<BookOpenIcon size={16} />}
      />
      <PageMenuLink
        name="Evaluations"
        href={evaluationsRoute()}
        icon={<ShareIcon size={16} />}
      />
      <PageMenuLink
        name="Epistemic Agents"
        href={epistemicAgentsRoute()}
        icon={<CommandLineIcon size={16} />}
      />
    </>
  );
};

export const FrontpageNav: FC = () => {
  return (
    <PageMenu
      mobileHeader={<MobileFrontpageNavHeader />}
      desktopHeader={<FrontpageNavDesktopHeader />}
    >
      <PageMenuLink
        name="Models"
        href="/"
        icon={<CodeBracketSquareIcon size={16} />}
      />
      <PageMenuLink
        name="Variables"
        href={variablesRoute()}
        icon={<ShareIcon size={16} />}
      />
      <PageMenuLink
        name="Groups"
        href={groupsRoute()}
        icon={<GroupIcon size={16} />}
      />
      <PageMenuSubheader>Experimental</PageMenuSubheader>
      <PageMenuLink
        name="Definitions"
        href={definitionsRoute()}
        icon={<ScaleIcon size={16} />}
      />
      <Suspense>
        <FrontpageNavEvalsIfRoot />
      </Suspense>
    </PageMenu>
  );
};
