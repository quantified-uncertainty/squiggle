import {
  MembershipRole,
  SetMembershipRoleActionMutation,
} from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { DropdownMenuAsyncActionItem, RefreshIcon } from "@quri/ui";
import { FC } from "react";
import { graphql } from "relay-runtime";

const Mutation = graphql`
  mutation SetMembershipRoleActionMutation(
    $input: MutationUpdateMembershipRoleInput!
  ) {
    result: updateMembershipRole(input: $input) {
      __typename
      ... on BaseError {
        message
      }
    }
  }
`;

type Props = {
  membershipId: string;
  role: MembershipRole;
  close: () => void;
};

export const SetMembershipRoleAction: FC<Props> = ({
  membershipId,
  role,
  close,
}) => {
  const [runMutation] = useAsyncMutation<SetMembershipRoleActionMutation>({
    mutation: Mutation,
    expectedTypename: "UpdateMembershipRoleResult",
  });

  const act = () =>
    runMutation({
      variables: {
        input: {
          membershipId,
          role,
        },
      },
    });

  return (
    <DropdownMenuAsyncActionItem
      title={role}
      icon={RefreshIcon}
      onClick={act}
      close={close}
    />
  );
};
