"use client";
import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import { NewEvalEntityButton } from "@/evals/components/NewEvalEntityButton";
import {
  evalRunnersRoute,
  evaluationsRoute,
  speclistsRoute,
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
          name="Spec Lists"
          href={speclistsRoute()}
          prefetch
          selected={(pathname) => isSubpath(pathname, speclistsRoute())}
        />
        <StyledTabLink
          name="Eval Runners"
          href={evalRunnersRoute()}
          prefetch
          selected={(pathname) => isSubpath(pathname, evalRunnersRoute())}
        />
      </StyledTabLinkList>
      <NewEvalEntityButton />
    </div>
  );
};
