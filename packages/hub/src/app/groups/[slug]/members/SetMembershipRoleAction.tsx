import { MembershipRole } from "@prisma/client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { ServerActionDropdownAction } from "@/components/ui/ServerActionDropdownAction";
import { updateMembershipRoleAction } from "@/server/groups/actions/updateMembershipRoleAction";
import { GroupMemberDTO } from "@/server/groups/data/members";

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
  membership: GroupMemberDTO;
  groupSlug: string;
  role: MembershipRole;
  update: (membership: GroupMemberDTO) => void;
};

export const SetMembershipRoleAction: FC<Props> = ({
  membership,
  groupSlug,
  role,
  update,
}) => {
  return (
    <ServerActionDropdownAction
      act={async () => {
        const newMembership = await updateMembershipRoleAction({
          user: membership.user.slug,
          group: groupSlug,
          role,
        });
        update(newMembership);
      }}
      title={role}
    />
  );
};
