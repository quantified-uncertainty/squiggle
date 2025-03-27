import { FC } from "react";

import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import {
  definitionsRoute,
  epistemicAgentsRoute,
  evaluationsRoute,
  groupsRoute,
  questionSetsRoute,
  variablesRoute,
} from "@/lib/routes";

export const FrontpageNav: FC = () => {
  return (
    <div className="flex items-center gap-2">
      <StyledTabLinkList>
        <StyledTabLink name="Models" href="/" prefetch />
        <StyledTabLink name="Variables" href={variablesRoute()} prefetch />
        <StyledTabLink name="Definitions" href={definitionsRoute()} prefetch />
        <StyledTabLink name="Groups" href={groupsRoute()} prefetch />
        <StyledTabLink name="Evals" href={evaluationsRoute()} prefetch />
        <StyledTabLink
          name="Question Sets"
          href={questionSetsRoute()}
          prefetch
        />
        <StyledTabLink
          name="Epistemic Agents"
          href={epistemicAgentsRoute()}
          prefetch
        />
      </StyledTabLinkList>
    </div>
  );
};
