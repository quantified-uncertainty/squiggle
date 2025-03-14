import { PropsWithChildren } from "react";

import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import {
  evalRunnersRoute,
  evaluationsRoute,
  speclistsRoute,
} from "@/lib/routes";

import { NewEntityButton } from "./NewEntityButton";

export default async function FrontPageLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <StyledTabLinkList>
          <StyledTabLink name="Spec Lists" href={speclistsRoute()} prefetch />
          <StyledTabLink name="Evals" href={evaluationsRoute()} prefetch />
          <StyledTabLink
            name="Eval Runners"
            href={evalRunnersRoute()}
            prefetch
          />
        </StyledTabLinkList>
        <NewEntityButton />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
