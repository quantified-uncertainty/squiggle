import { signOut } from "next-auth/react";
import { FC } from "react";

import {
  DropdownMenuActionItem,
  DropdownMenuHeader,
  ScaleIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { newDefinitionRoute, userRoute } from "@/routes";

type Props = {
  close: () => void;
  username: string;
  mode: "desktop" | "mobile";
};

// this component is shared between DesktopUserControls, which is a normal Dropdown, and MobileUserControls, which is a fake dropdown.
// In both cases, it should be wrapped in DropdownMenu.
export const UserControlsMenu: FC<Props> = ({ close, username, mode }) => {
  return (
    <>
      <DropdownMenuHeader>
        {mode === "desktop" ? "User Actions" : `@${username}`}
      </DropdownMenuHeader>
      <DropdownMenuNextLinkItem
        href={userRoute({ username })}
        icon={UserCircleIcon}
        title="Profile"
        close={close}
      />
      <DropdownMenuActionItem
        onClick={() => {
          signOut();
          close();
        }}
        icon={SignOutIcon}
        title="Sign Out"
      />
      <DropdownMenuHeader>Experimental</DropdownMenuHeader>
      <DropdownMenuNextLinkItem
        href={newDefinitionRoute()}
        icon={ScaleIcon}
        title="New Relative Value Definition"
        close={close}
      />
    </>
  );
};
