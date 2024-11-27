import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import { definitionsRoute, groupsRoute, variablesRoute } from "@/routes";

export default function FrontPageLayout({ children }: PropsWithChildren) {
  return (
    <NarrowPageLayout>
      <StyledTabLinkList>
        <StyledTabLink name="Models" href="/" prefetch />
        <StyledTabLink name="Variables" href={variablesRoute()} prefetch />
        <StyledTabLink name="Definitions" href={definitionsRoute()} prefetch />
        <StyledTabLink name="Groups" href={groupsRoute()} prefetch />
      </StyledTabLinkList>
      <div className="mt-8">{children}</div>
    </NarrowPageLayout>
  );
}
