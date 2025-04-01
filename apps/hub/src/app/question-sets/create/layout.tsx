"use client";

import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import {
  createQuestionSetFromGitHubIssuesRoute,
  createQuestionSetFromMetaforecastRoute,
  createQuestionSetRoute,
  questionSetsRoute,
} from "@/lib/routes";

export default function QuestionSetCreateLayout({
  children,
}: PropsWithChildren) {
  return (
    <NarrowPageLayout>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create New Question Set</H2>
        <StyledLink href={questionSetsRoute()}>
          ← Back to Question Sets
        </StyledLink>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <StyledTabLink.List>
          <StyledTabLink name="Manual" href={createQuestionSetRoute()} />
          <StyledTabLink
            name="From Metaforecast"
            href={createQuestionSetFromMetaforecastRoute()}
          />
          <StyledTabLink
            name="From GitHub Issues (TODO)"
            href={createQuestionSetFromGitHubIssuesRoute()}
          />
        </StyledTabLink.List>
      </div>

      <div>{children}</div>
    </NarrowPageLayout>
  );
}
