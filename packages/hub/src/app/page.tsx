"use client";

import { newModelRoute } from "@/routes";
import { FrontpageModelList } from "./FrontpageModelList";
import { StyledLink } from "@/components/ui/StyledLink";

export default function IndexPage() {
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <div className="space-y-4">
        <FrontpageModelList />
        <div>
          <StyledLink href={newModelRoute()}>Create new model</StyledLink>
        </div>
      </div>
    </div>
  );
}
