import {
  MembershipRole,
  SetMembershipRoleActionMutation,
} from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { MutationAction } from "@/components/ui/MutationAction";
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
      ... on UpdateMembershipRoleResult {
        membership {
          id
          role
        }
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
  return (
    <MutationAction<
      SetMembershipRoleActionMutation,
      "UpdateMembershipRoleResult"
    >
      mutation={Mutation}
      variables={{
        input: {
          membershipId,
          role,
        },
      }}
      expectedTypename="UpdateMembershipRoleResult"
      title={role}
      close={close}
    />
  );
};
