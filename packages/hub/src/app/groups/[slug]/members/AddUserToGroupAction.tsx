import { FC } from "react";
import { useFragment } from "react-relay";
import { ConnectionHandler, graphql } from "relay-runtime";

import { PlusIcon, SelectStringFormField } from "@quri/ui";

import { SelectUser, SelectUserOption } from "@/components/SelectUser";
import { MutationModalAction } from "@/components/ui/MutationModalAction";

import { AddUserToGroupAction_group$key } from "@/__generated__/AddUserToGroupAction_group.graphql";
import { AddUserToGroupActionMutation } from "@/__generated__/AddUserToGroupActionMutation.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";

const Mutation = graphql`
  mutation AddUserToGroupActionMutation(
    $input: MutationAddUserToGroupInput!
    $connections: [ID!]!
  ) {
    result: addUserToGroup(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on AddUserToGroupResult {
        membership
          @appendNode(
            connections: $connections
            edgeTypeName: "UserGroupMembershipEdge"
          ) {
          ...GroupMemberCard
        }
      }
    }
  }
`;

type Props = {
  groupRef: AddUserToGroupAction_group$key;
  close: () => void;
};

type FormShape = { user: SelectUserOption; role: MembershipRole };

export const AddUserToGroupAction: FC<Props> = ({ groupRef, close }) => {
  const group = useFragment(
    graphql`
      fragment AddUserToGroupAction_group on Group {
        id
        slug
      }
    `,
    groupRef
  );

  return (
    <MutationModalAction<AddUserToGroupActionMutation, FormShape>
      title="Add"
      icon={PlusIcon}
      close={close}
      mutation={Mutation}
      expectedTypename="AddUserToGroupResult"
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
            "GroupMemberList_memberships"
          ),
        ],
      })}
      submitText="Add"
      modalTitle={`Add to group ${group.slug}`}
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
