import { signIn, useSession } from "next-auth/react";
import { FC } from "react";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { DropdownWithArrow } from "./DropdownWithArrow";
import { UserControlsMenu } from "./UserControlsMenu";
import { useUsername } from "@/hooks/useUsername";

export const DesktopUserControls: FC = () => {
  const username = useUsername();

  return username ? (
    <div className="flex items-center gap-2">
      <Dropdown
        render={({ close }) => (
          <DropdownMenu>
            <UserControlsMenu
              mode="desktop"
              close={close}
              username={username}
            />
          </DropdownMenu>
        )}
      >
        <DropdownWithArrow text={username} />
      </Dropdown>
    </div>
  ) : (
    <Button onClick={() => signIn()}>Sign In</Button>
  );
};
