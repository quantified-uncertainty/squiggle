import { FC } from "react";
import { useFragment } from "react-relay";
import { ConnectionHandler, graphql } from "relay-runtime";

import { PlusIcon, SelectStringFormField } from "@quri/ui";

import { InviteUserToGroupActionMutation } from "@/__generated__/InviteUserToGroupActionMutation.graphql";
import { InviteUserToGroupAction_group$key } from "@/__generated__/InviteUserToGroupAction_group.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { SelectUser, SelectUserOption } from "@/components/SelectUser";
import { MutationModalAction } from "@/components/ui/MutationModalAction";

const Mutation = graphql`
  mutation InviteUserToGroupActionMutation(
    $input: MutationInviteUserToGroupInput!
    $connections: [ID!]!
  ) {
    result: inviteUserToGroup(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on InviteUserToGroupResult {
        invite
          @prependNode(
            connections: $connections
            edgeTypeName: "GroupInviteEdge"
          ) {
          ...GroupInviteCard
        }
      }
    }
  }
`;

type Props = {
  groupRef: InviteUserToGroupAction_group$key;
  close: () => void;
};

type FormShape = { user: SelectUserOption; role: MembershipRole };

export const InviteUserToGroupAction: FC<Props> = ({ groupRef, close }) => {
  const group = useFragment(
    graphql`
      fragment InviteUserToGroupAction_group on Group {
        id
        slug
      }
    `,
    groupRef
  );

  return (
    <MutationModalAction<InviteUserToGroupActionMutation, FormShape>
      title="Invite"
      icon={PlusIcon}
      close={close}
      mutation={Mutation}
      expectedTypename="InviteUserToGroupResult"
      defaultValues={{ role: "Member" }}
      formDataToVariables={(data) => ({
        input: {
          group: group.slug,
          username: data.user.username,
          role: data.role,
        },
        connections: [
          ConnectionHandler.getConnectionID(
            group.id,
            "GroupInviteList_invites"
          ),
        ],
      })}
      submitText="Invite"
      modalTitle={`Invite to group ${group.slug}`}
    >
      {() => (
        <div className="space-y-2">
          <SelectUser<FormShape> label="User" name="user" />
          <SelectStringFormField<FormShape, MembershipRole>
            name="role"
            label="Role"
            options={["Member", "Admin"]}
            required
          />
        </div>
      )}
    </MutationModalAction>
  );
};
