import { useRouter } from "next/navigation";
import { FC } from "react";
import { CodeBracketIcon, Dropdown, DropdownMenu, ScaleIcon } from "@quri/ui";
import { newDefinitionRoute, newModelRoute } from "@/routes";
import { DropdownWithArrow } from "./DropdownWithArrow";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";

export const NewDropdown: FC = () => {
  const router = useRouter();
  return (
    <Dropdown
      render={({ close }: { close: () => void }) => (
        <DropdownMenu>
          <DropdownMenuLinkItem
            href={newModelRoute()}
            icon={CodeBracketIcon}
            title="New Model"
            close={close}
          />
          <DropdownMenuLinkItem
            href={newDefinitionRoute()}
            icon={ScaleIcon}
            title="New Relative Value Definition"
            close={close}
          />
        </DropdownMenu>
      )}
    >
      <DropdownWithArrow text="New" />
    </Dropdown>
  );
};
