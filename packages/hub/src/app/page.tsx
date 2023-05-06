"use client";

import { newModelRoute } from "@/routes";
import { ModelList } from "./ModelList";
import { StyledLink } from "@/components/ui/StyledLink";

export default function IndexPage() {
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <ModelList />
      <StyledLink href={newModelRoute()}>New model</StyledLink>
    </div>
  );
}
