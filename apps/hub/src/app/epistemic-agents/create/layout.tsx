"use client";

import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { createEpistemicAgentRoute, createManifoldEpistemicAgentRoute, epistemicAgentsRoute } from "@/lib/routes";

export default function EpistemicAgentCreateLayout({
  children,
}: PropsWithChildren) {
  return (
    <NarrowPageLayout>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create New Epistemic Agent</H2>
        <StyledLink href={epistemicAgentsRoute()}>
          ← Back to Epistemic Agents
        </StyledLink>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <StyledTabLink.List>
          <StyledTabLink name="Squiggle AI" href={createEpistemicAgentRoute()} />
          <StyledTabLink name="Manifold" href={createManifoldEpistemicAgentRoute()} />
        </StyledTabLink.List>
      </div>

      <div>{children}</div>
    </NarrowPageLayout>
  );
}