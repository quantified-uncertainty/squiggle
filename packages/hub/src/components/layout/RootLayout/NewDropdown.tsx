import { useRouter } from "next/navigation";
import { FC } from "react";

import {
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  ScaleIcon,
} from "@quri/ui";

import { newDefinitionRoute, newModelRoute } from "@/routes";
import { DropdownWithArrow } from "./DropdownWithArrow";

export const NewDropdown: FC = () => {
  const router = useRouter();
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <DropdownMenuActionItem
            onClick={() => router.push(newModelRoute())}
            icon={CodeBracketIcon}
            title="New Model"
          />
          <DropdownMenuActionItem
            onClick={() => router.push(newDefinitionRoute())}
            icon={ScaleIcon}
            title="New Relative Value Definition"
          />
        </DropdownMenu>
      )}
    >
      <DropdownWithArrow text="New" />
    </Dropdown>
  );
};
