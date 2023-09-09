import { FC } from "react";
import { useFragment } from "react-relay";
import { ConnectionHandler, graphql } from "relay-runtime";

import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";

import { DeleteMembershipActionMutation } from "@/__generated__/DeleteMembershipActionMutation.graphql";
import { DeleteMembershipAction_Group$key } from "@/__generated__/DeleteMembershipAction_Group.graphql";
import { DeleteMembershipAction_Membership$key } from "@/__generated__/DeleteMembershipAction_Membership.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";

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
  groupRef: DeleteMembershipAction_Group$key;
  membershipRef: DeleteMembershipAction_Membership$key;
  close: () => void;
};

export const DeleteMembershipAction: FC<Props> = ({
  groupRef,
  membershipRef,
  close,
}) => {
  const [runMutation] = useAsyncMutation<DeleteMembershipActionMutation>({
    mutation: Mutation,
    expectedTypename: "DeleteMembershipResult",
  });

  const group = useFragment(
    graphql`
      fragment DeleteMembershipAction_Group on Group {
        id
        slug
      }
    `,
    groupRef
  );

  const membership = useFragment(
    graphql`
      fragment DeleteMembershipAction_Membership on UserGroupMembership {
        id
        user {
          slug
        }
      }
    `,
    membershipRef
  );

  const act = async () => {
    await runMutation({
      variables: {
        input: { group: group.slug, user: membership.user.slug },
      },
      updater: (store) => {
        const groupRecord = store.get(group.id);
        if (!groupRecord) return;
        const connectionRecord = ConnectionHandler.getConnection(
          groupRecord,
          "GroupMemberList_memberships"
        );
        if (!connectionRecord) return;
        ConnectionHandler.deleteNode(connectionRecord, membership.id);
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
