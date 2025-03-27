"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { ButtonWithDropdown, DropdownMenu, PlusIcon } from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { CreateEpistemicAgentButton } from "@/evals/components/CreateEpistemicAgentButton";
import {
  createQuestionSetFromGitHubIssuesRoute,
  createQuestionSetFromMetaforecastRoute,
  createQuestionSetRoute,
} from "@/lib/routes";

export const NewEvalEntityButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  switch (segment) {
    case "question-sets":
      return (
        <ButtonWithDropdown
          renderDropdown={() => (
            <DropdownMenu>
              <DropdownMenuNextLinkItem
                href={createQuestionSetRoute()}
                title="Manually"
              />
              <DropdownMenuNextLinkItem
                href={createQuestionSetFromMetaforecastRoute()}
                title="From Metaforecast"
              />
              <DropdownMenuNextLinkItem
                href={createQuestionSetFromGitHubIssuesRoute()}
                title="From GitHub Issues"
              />
            </DropdownMenu>
          )}
        >
          <div className="flex items-center gap-1">
            <PlusIcon size={16} />
            New Question Set
          </div>
        </ButtonWithDropdown>
      );
    case "epistemic-agents":
      return <CreateEpistemicAgentButton />;
    default:
      return null;
  }
};
