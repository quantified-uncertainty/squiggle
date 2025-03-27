"use client";
import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import { NewEvalEntityButton } from "@/evals/components/NewEvalEntityButton";
import {
  epistemicAgentsRoute,
  evaluationsRoute,
  questionSetsRoute,
} from "@/lib/routes";

function isSubpath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(route + "/");
}

export const EvalsTabs = () => {
  return (
    <div className="flex items-center gap-2">
      <StyledTabLinkList theme="primary">
        <StyledTabLink
          name="Evals"
          href={evaluationsRoute()}
          prefetch
          selected={(pathname) =>
            pathname === evaluationsRoute() ||
            isSubpath(pathname, evaluationsRoute() + "/eval")
          }
        />
        <StyledTabLink
          name="Question Sets"
          href={questionSetsRoute()}
          prefetch
          selected={(pathname) => isSubpath(pathname, questionSetsRoute())}
        />
        <StyledTabLink
          name="Epistemic Agents"
          href={epistemicAgentsRoute()}
          prefetch
          selected={(pathname) => isSubpath(pathname, epistemicAgentsRoute())}
        />
      </StyledTabLinkList>
      <NewEvalEntityButton />
    </div>
  );
};
