import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { InviteForMe$key } from "@/__generated__/InviteForMe.graphql";
import {
  GroupInviteReaction,
  InviteForMeMutation,
} from "@/__generated__/InviteForMeMutation.graphql";
import { Card } from "@/components/ui/Card";
import { MutationButton } from "@/components/ui/MutationButton";

const Fragment = graphql`
  fragment InviteForMe on Group {
    id
    inviteForMe {
      id
      role
    }
  }
`;

const Mutation = graphql`
  mutation InviteForMeMutation($input: MutationReactToGroupInviteInput!) {
    result: reactToGroupInvite(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on ReactToGroupInviteResult {
        invite {
          id
        }
      }
    }
  }
`;

const InviteReactButton: FC<{
  inviteId: string;
  groupId: string;
  action: GroupInviteReaction;
  title: string;
  theme?: "default" | "primary";
}> = ({ inviteId, groupId, action, title, theme }) => {
  return (
    <MutationButton<InviteForMeMutation, "ReactToGroupInviteResult">
      mutation={Mutation}
      variables={{
        input: { inviteId, action },
      }}
      updater={(store) => {
        // updating the invites connection is hard, let's just reload page data
        store.get(groupId)?.invalidateRecord();
      }}
      expectedTypename="ReactToGroupInviteResult"
      title={title}
      theme={theme}
    ></MutationButton>
  );
};

type Props = {
  groupRef: InviteForMe$key;
};

export const InviteForMe: FC<Props> = ({ groupRef }) => {
  const group = useFragment(Fragment, groupRef);

  if (!group.inviteForMe) {
    return null;
  }

  const inviteId = group.inviteForMe.id;

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>{"You've been invited to this group."}</div>
        <div className="flex gap-2">
          <InviteReactButton
            groupId={group.id}
            inviteId={inviteId}
            action="Decline"
            title="Decline"
          />
          <InviteReactButton
            groupId={group.id}
            inviteId={inviteId}
            action="Accept"
            title="Accept"
            theme="primary"
          />
        </div>
      </div>
    </Card>
  );
};
