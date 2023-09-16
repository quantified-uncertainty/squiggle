import { FC } from "react";
import { ConnectionHandler, graphql } from "relay-runtime";

import { TrashIcon } from "@quri/ui";

import { MutationAction } from "@/components/ui/MutationAction";
import { CancelInviteActionMutation } from "@/__generated__/CancelInviteActionMutation.graphql";

type Props = {
  inviteId: string;
  groupId: string;
  close: () => void;
};

export const CancelInviteAction: FC<Props> = ({ inviteId, groupId, close }) => {
  return (
    <MutationAction<CancelInviteActionMutation, "CancelGroupInviteResult">
      title="Cancel"
      icon={TrashIcon}
      mutation={graphql`
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
      `}
      expectedTypename="CancelGroupInviteResult"
      variables={{
        input: { inviteId },
        connections: [
          ConnectionHandler.getConnectionID(groupId, "GroupInviteList_invites"),
        ],
      }}
      close={close}
    />
  );
};
