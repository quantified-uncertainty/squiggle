"use client";
import { FC } from "react";

import { ButtonWithDropdown, DropdownMenu, PlusIcon } from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import {
  createQuestionSetFromGitHubIssuesRoute,
  createQuestionSetFromMetaforecastRoute,
  createQuestionSetRoute,
} from "@/lib/routes";

export const LayoutActions: FC = () => {
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
};
