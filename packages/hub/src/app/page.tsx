"use client";

import { newModelRoute } from "@/routes";
import { FrontpageModelList } from "./FrontpageModelList";
import { StyledLink } from "@/components/ui/StyledLink";
import { useSession } from "next-auth/react";

export default function IndexPage() {
  const { data: session } = useSession();

  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <div className="space-y-4">
        <FrontpageModelList />
        {session ? (
          <div>
            <StyledLink href={newModelRoute()}>Create new model</StyledLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}
