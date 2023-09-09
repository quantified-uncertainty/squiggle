import { GroupInviteCard$key } from "@/__generated__/GroupInviteCard.graphql";
import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { Card } from "@/components/ui/Card";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { DropdownMenu } from "@quri/ui";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { InviteRoleButton } from "./InviteRoleButton";
import { UserGroupInvite } from "./UserGroupInvite";
import { CancelInviteAction } from "./CancelInviteAction";

export const GroupInviteCard: FC<{
  inviteRef: GroupInviteCard$key;
  groupRef: hooks_useIsGroupAdmin$key;
  groupId: string;
}> = (props) => {
  const invite = useFragment(
    graphql`
      fragment GroupInviteCard on GroupInvite {
        __typename
        id
        role
        ...InviteRoleButton
        ...UserGroupInvite
      }
    `,
    props.inviteRef
  );

  return (
    <Card key={invite.id}>
      <div className="flex justify-between items-center">
        <div>
          {invite.__typename === "UserGroupInvite" ? (
            <UserGroupInvite inviteRef={invite} />
          ) : (
            "Unknown invite type"
          )}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-slate-500 text-sm">Invited as:</span>
          <InviteRoleButton inviteRef={invite} />
          <DotsDropdown>
            {({ close }) => (
              <DropdownMenu>
                <CancelInviteAction
                  close={close}
                  inviteId={invite.id}
                  groupId={props.groupId}
                />
              </DropdownMenu>
            )}
          </DotsDropdown>
        </div>
      </div>
    </Card>
  );
};
