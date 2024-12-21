import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { FC } from "react";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { DropdownWithArrow } from "./DropdownWithArrow";
import { UserControlsMenu } from "./UserControlsMenu";

export const DesktopUserControls: FC<{ session: Session | null }> = ({
  session,
}) => {
  const username = session?.user?.username;

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
