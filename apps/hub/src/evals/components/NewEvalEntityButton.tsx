"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { CreateEvalRunnerButton } from "@/evals/components/CreateEvalRunnerButton";
import { createSpecListRoute } from "@/lib/routes";

export const NewEvalEntityButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  switch (segment) {
    case "speclists":
      return (
        <LinkButton href={createSpecListRoute()}>
          <div className="flex items-center gap-1">
            <PlusIcon size={16} />
            New Spec List
          </div>
        </LinkButton>
      );
    case "eval-runners":
      return <CreateEvalRunnerButton />;
    default:
      return null;
  }
};
