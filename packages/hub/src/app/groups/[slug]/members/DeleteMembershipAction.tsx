import { DeleteMembershipActionMutation } from "@/__generated__/DeleteMembershipActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";
import { FC } from "react";
import { ConnectionHandler, graphql } from "relay-runtime";

const Mutation = graphql`
  mutation DeleteMembershipActionMutation(
    $input: MutationDeleteMembershipInput!
  ) {
    result: deleteMembership(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on DeleteMembershipResult {
        ok
      }
    }
  }
`;

type Props = {
  groupId: string;
  membershipId: string;
  close: () => void;
};

export const DeleteMembershipAction: FC<Props> = ({
  groupId,
  membershipId,
  close,
}) => {
  const [runMutation] = useAsyncMutation<DeleteMembershipActionMutation>({
    mutation: Mutation,
    expectedTypename: "DeleteMembershipResult",
  });

  const act = async () => {
    await runMutation({
      variables: {
        input: { membershipId },
      },
      updater: (store) => {
        const groupRecord = store.get(groupId);
        if (!groupRecord) return;
        const connectionRecord = ConnectionHandler.getConnection(
          groupRecord,
          "GroupMemberList_memberships"
        );
        if (!connectionRecord) return;
        ConnectionHandler.deleteNode(connectionRecord, membershipId);
      },
    });
  };

  return (
    <DropdownMenuAsyncActionItem
      title="Delete from group"
      icon={TrashIcon}
      onClick={act}
      close={close}
    />
  );
};
