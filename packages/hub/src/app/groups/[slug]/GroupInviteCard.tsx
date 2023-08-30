import { GroupInviteCard$key } from "@/__generated__/GroupInviteCard.graphql";
import { Card } from "@/components/ui/Card";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { EmailGroupInvite } from "./EmailGroupInvite";
import { InviteRoleButton } from "./InviteRoleButton";
import { UserGroupInvite } from "./UserGroupInvite";
import { useIsGroupAdmin } from "./hooks";
import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { DropdownMenu } from "@quri/ui";
import { CancelInviteAction } from "./CancelInviteAction";

export const GroupInviteCard: FC<{
  inviteRef: GroupInviteCard$key;
  groupRef: hooks_useIsGroupAdmin$key;
}> = (props) => {
  const invite = useFragment(
    graphql`
      fragment GroupInviteCard on GroupInvite {
        __typename
        id
        role
        ...InviteRoleButton
        ...UserGroupInvite
        ...EmailGroupInvite
      }
    `,
    props.inviteRef
  );

  const isAdmin = useIsGroupAdmin(props.groupRef);

  return (
    <Card key={invite.id}>
      <div className="flex justify-between items-center">
        <div>
          {invite.__typename === "UserGroupInvite" ? (
            <UserGroupInvite inviteRef={invite} />
          ) : invite.__typename === "EmailGroupInvite" ? (
            <EmailGroupInvite inviteRef={invite} />
          ) : (
            "Unknown invite type"
          )}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-slate-500 text-sm">Invited as:</span>
          {isAdmin ? <InviteRoleButton inviteRef={invite} /> : invite.role}
          <DotsDropdown>
            {({ close }) => (
              <DropdownMenu>
                <CancelInviteAction close={close} inviteId={invite.id} />
              </DropdownMenu>
            )}
          </DotsDropdown>
        </div>
      </div>
    </Card>
  );
};
