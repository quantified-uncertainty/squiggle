import { FC } from "react";
import { graphql } from "relay-runtime";

import { SetInviteRoleActionMutation } from "@/__generated__/SetInviteRoleActionMutation.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { MutationAction } from "@/components/ui/MutationAction";

const Mutation = graphql`
  mutation SetInviteRoleActionMutation(
    $input: MutationUpdateGroupInviteRoleInput!
  ) {
    result: updateGroupInviteRole(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateGroupInviteRoleResult {
        invite {
          id
          role
        }
      }
    }
  }
`;

type Props = {
  inviteId: string;
  role: MembershipRole;
  close: () => void;
};

export const SetInviteRoleButton: FC<Props> = ({ inviteId, role, close }) => {
  return (
    <MutationAction<SetInviteRoleActionMutation, "UpdateGroupInviteRoleResult">
      mutation={Mutation}
      variables={{
        input: {
          inviteId,
          role,
        },
      }}
      expectedTypename="UpdateGroupInviteRoleResult"
      title={role}
      close={close}
    />
  );
};
