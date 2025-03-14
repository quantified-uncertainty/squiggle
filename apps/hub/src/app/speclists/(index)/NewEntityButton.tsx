"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { CreateEvaluatorButton } from "@/evals/components/CreateEvaluatorButton";
import { createSpecListRoute } from "@/lib/routes";

export const NewEntityButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  console.log({ segment });

  switch (segment) {
    case null:
      // default - speclists
      return (
        <LinkButton href={createSpecListRoute()}>
          <div className="flex items-center gap-1">
            <PlusIcon size={16} />
            New Spec List
          </div>
        </LinkButton>
      );
    case "evaluators":
      return <CreateEvaluatorButton />;
  }
};
