import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { DropdownMenu } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { DotsDropdown } from "@/components/ui/DotsDropdown";

import { CancelInviteAction } from "./CancelInviteAction";
import { InviteRoleButton } from "./InviteRoleButton";
import { UserGroupInvite } from "./UserGroupInvite";

import { GroupInviteCard$key } from "@/__generated__/GroupInviteCard.graphql";

export const GroupInviteCard: FC<{
  inviteRef: GroupInviteCard$key;
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
      <div className="flex items-center justify-between">
        <div>
          {invite.__typename === "UserGroupInvite" ? (
            <UserGroupInvite inviteRef={invite} />
          ) : (
            "Unknown invite type"
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-500">Invited as:</span>
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
