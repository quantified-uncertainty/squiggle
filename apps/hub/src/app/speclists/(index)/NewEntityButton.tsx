"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { createSpecListRoute } from "@/lib/routes";

export const NewEntityButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  const link = createSpecListRoute();

  if (segment === "evals" || segment === "evaluators") {
    return null;
  }

  return (
    <LinkButton href={link}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Spec List
      </div>
    </LinkButton>
  );
};
