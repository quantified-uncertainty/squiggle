import { SetInviteRoleActionMutation } from "@/__generated__/SetInviteRoleActionMutation.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { DropdownMenuAsyncActionItem, RefreshIcon } from "@quri/ui";
import { FC } from "react";
import { graphql } from "relay-runtime";

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
  const [runMutation] = useAsyncMutation<SetInviteRoleActionMutation>({
    mutation: Mutation,
    expectedTypename: "UpdateGroupInviteRoleResult",
  });

  const act = async () => {
    await runMutation({
      variables: {
        input: {
          inviteId,
          role,
        },
      },
    });
    close();
  };

  return (
    <DropdownMenuAsyncActionItem title={role} onClick={act} close={close} />
  );
};
