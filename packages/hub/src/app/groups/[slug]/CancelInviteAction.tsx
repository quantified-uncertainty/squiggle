import { CancelInviteActionMutation } from "@/__generated__/CancelInviteActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";
import { FC } from "react";
import { ConnectionHandler, graphql } from "relay-runtime";

const Mutation = graphql`
  mutation CancelInviteActionMutation(
    $input: MutationCancelGroupInviteInput!
    $connections: [ID!]!
  ) {
    result: cancelGroupInvite(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CancelGroupInviteResult {
        invite {
          id @deleteEdge(connections: $connections)
        }
      }
    }
  }
`;

type Props = {
  inviteId: string;
  groupId: string;
  close: () => void;
};

export const CancelInviteAction: FC<Props> = ({ inviteId, groupId, close }) => {
  const [runMutation] = useAsyncMutation<CancelInviteActionMutation>({
    mutation: Mutation,
    expectedTypename: "CancelGroupInviteResult",
  });

  const act = async () => {
    await runMutation({
      variables: {
        input: { inviteId },
        connections: [
          ConnectionHandler.getConnectionID(groupId, "GroupInviteList_invites"),
        ],
      },
    });
  };

  return (
    <DropdownMenuAsyncActionItem
      title="Cancel"
      icon={TrashIcon}
      onClick={act}
      close={close}
    />
  );
};
