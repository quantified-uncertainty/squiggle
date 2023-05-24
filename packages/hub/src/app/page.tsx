"use client";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { StyledLink } from "@/components/ui/StyledLink";
import { newDefinitionRoute, newModelRoute } from "@/routes";
import { useSession } from "next-auth/react";
import { FrontpageModelList } from "./FrontpageModelList";
import { FrontpageDefinitionList } from "./FrontpageDefinitionList";

export default function IndexPage() {
  const { data: session } = useSession();

  return (
    <NarrowPageLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <FrontpageModelList />
          {session ? (
            <div>
              <StyledLink href={newModelRoute()}>Create new model</StyledLink>
            </div>
          ) : null}
        </div>
        <div className="space-y-4">
          <FrontpageDefinitionList />
          {session ? (
            <div>
              <StyledLink href={newDefinitionRoute()}>
                Create new definition
              </StyledLink>
            </div>
          ) : null}
        </div>
      </div>
    </NarrowPageLayout>
  );
}
