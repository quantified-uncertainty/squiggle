import { CancelInviteActionMutation } from "@/__generated__/CancelInviteActionMutation.graphql";
import { InviteForMe$key } from "@/__generated__/InviteForMe.graphql";
import {
  GroupInviteReaction,
  InviteForMeMutation,
} from "@/__generated__/InviteForMeMutation.graphql";
import { Card } from "@/components/ui/Card";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { Button, DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";
import { FC } from "react";
import { useFragment } from "react-relay";
import { ConnectionHandler, graphql } from "relay-runtime";

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

type Props = {
  groupRef: InviteForMe$key;
};

export const InviteForMe: FC<Props> = ({ groupRef }) => {
  const group = useFragment(Fragment, groupRef);

  const [runMutation] = useAsyncMutation<InviteForMeMutation>({
    mutation: Mutation,
    expectedTypename: "ReactToGroupInviteResult",
  });

  if (!group.inviteForMe) {
    return null;
  }

  const inviteId = group.inviteForMe.id;

  const act = async (action: GroupInviteReaction) => {
    await runMutation({
      variables: {
        input: { inviteId, action },
        // connections: [
        //   ConnectionHandler.getConnectionID(groupId, "GroupInviteList_invites"),
        // ],
      },
      updater: (store) => {
        store.get(group.id)?.invalidateRecord();
      },
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>{"You've been invited to this group."}</div>
        <div className="flex gap-2">
          <Button onClick={() => act("Decline")}>Decline</Button>
          <Button theme="primary" onClick={() => act("Accept")}>
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
};
