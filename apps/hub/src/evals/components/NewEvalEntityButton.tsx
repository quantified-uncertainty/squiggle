"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { ButtonWithDropdown, DropdownMenu, PlusIcon } from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { CreateEvalRunnerButton } from "@/evals/components/CreateEvalRunnerButton";
import {
  createSpecListFromGitHubIssuesRoute,
  createSpecListFromMetaforecastRoute,
  createSpecListRoute,
} from "@/lib/routes";

export const NewEvalEntityButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  switch (segment) {
    case "speclists":
      return (
        <ButtonWithDropdown
          renderDropdown={({ close }) => (
            <DropdownMenu>
              <DropdownMenuNextLinkItem
                href={createSpecListRoute()}
                title="Manually"
              />
              <DropdownMenuNextLinkItem
                href={createSpecListFromMetaforecastRoute()}
                title="From Metaforecast"
              />
              <DropdownMenuNextLinkItem
                href={createSpecListFromGitHubIssuesRoute()}
                title="From GitHub Issues"
              />
            </DropdownMenu>
          )}
        >
          <div className="flex items-center gap-1">
            <PlusIcon size={16} />
            New Spec List
          </div>
        </ButtonWithDropdown>
      );
    case "eval-runners":
      return <CreateEvalRunnerButton />;
    default:
      return null;
  }
};
