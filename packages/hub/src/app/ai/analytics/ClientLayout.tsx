"use client";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { StyledTabLink } from "@/components/ui/StyledTabLink";

// workaround for https://github.com/vercel/next.js/issues/58776 - StyledTabLink won't work in server components
export const AiAnalyticsClientLayout = ({ children }: PropsWithChildren) => {
  return (
    <NarrowPageLayout>
      <div className="mb-4 flex items-center gap-2">
        <StyledTabLink.List>
          <StyledTabLink name="Statistics" href="/ai/analytics" />
          <StyledTabLink name="All Errors" href="/ai/analytics/code-errors" />
        </StyledTabLink.List>
      </div>
      <div>{children}</div>
    </NarrowPageLayout>
  );
};
