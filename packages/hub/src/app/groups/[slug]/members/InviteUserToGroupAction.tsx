import { FC } from "react";
import { FaPlus } from "react-icons/fa";
import { useFragment } from "react-relay";
import Select from "react-select";
import { ConnectionHandler, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import { InviteUserToGroupActionMutation } from "@/__generated__/InviteUserToGroupActionMutation.graphql";
import { InviteUserToGroupAction_group$key } from "@/__generated__/InviteUserToGroupAction_group.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { SelectUser } from "@/components/SelectUser";
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

type FormShape = { username: string; role: MembershipRole };

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
      icon={FaPlus}
      close={close}
      mutation={Mutation}
      expectedTypename="InviteUserToGroupResult"
      defaultValues={{ role: "Member" }}
      formDataToVariables={(data) => ({
        input: {
          group: group.slug,
          username: data.username,
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
          <SelectUser label="Username" name="username" />
          <ControlledFormField name="role" label="Role">
            {({ value, onChange }) => (
              <Select
                value={{ label: value, value }}
                options={["Member", "Admin"].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(option) => onChange(option?.value)}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
                menuPortalTarget={document.body}
              />
            )}
          </ControlledFormField>
        </div>
      )}
    </MutationModalAction>
  );
};
