"use client";

import { newModelRoute } from "@/routes";
import { FrontpageModelList } from "./FrontpageModelList";
import { StyledLink } from "@/components/ui/StyledLink";
import { useSession } from "next-auth/react";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function IndexPage() {
  const { data: session } = useSession();

  return (
    <NarrowPageLayout>
      <div className="space-y-4">
        <FrontpageModelList />
        {session ? (
          <div>
            <StyledLink href={newModelRoute()}>Create new model</StyledLink>
          </div>
        ) : null}
      </div>
    </NarrowPageLayout>
  );
}
