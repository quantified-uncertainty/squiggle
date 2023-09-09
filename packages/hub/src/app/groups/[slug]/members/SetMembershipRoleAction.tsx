import {
  MembershipRole,
  SetMembershipRoleActionMutation,
} from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { SetMembershipRoleAction_Group$key } from "@/__generated__/SetMembershipRoleAction_Group.graphql";
import { SetMembershipRoleAction_Membership$key } from "@/__generated__/SetMembershipRoleAction_Membership.graphql";
import { MutationAction } from "@/components/ui/MutationAction";
import { FC } from "react";
import { useFragment } from "react-relay";
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
  groupRef: SetMembershipRoleAction_Group$key;
  membershipRef: SetMembershipRoleAction_Membership$key;
  role: MembershipRole;
  close: () => void;
};

export const SetMembershipRoleAction: FC<Props> = ({
  groupRef,
  membershipRef,
  role,
  close,
}) => {
  const group = useFragment(
    graphql`
      fragment SetMembershipRoleAction_Group on Group {
        id
        slug
      }
    `,
    groupRef
  );

  const membership = useFragment(
    graphql`
      fragment SetMembershipRoleAction_Membership on UserGroupMembership {
        id
        user {
          slug
        }
      }
    `,
    membershipRef
  );

  return (
    <MutationAction<
      SetMembershipRoleActionMutation,
      "UpdateMembershipRoleResult"
    >
      mutation={Mutation}
      variables={{
        input: {
          user: membership.user.slug,
          group: group.slug,
          role,
        },
      }}
      expectedTypename="UpdateMembershipRoleResult"
      title={role}
      close={close}
    />
  );
};
