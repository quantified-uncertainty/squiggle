import { CancelInviteActionMutation } from "@/__generated__/CancelInviteActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";
import { FC } from "react";
import { graphql } from "relay-runtime";

const Mutation = graphql`
  mutation CancelInviteActionMutation($input: MutationCancelGroupInviteInput!) {
    result: cancelGroupInvite(input: $input) {
      __typename
      ... on BaseError {
        message
      }
    }
  }
`;

type Props = {
  inviteId: string;
  close: () => void;
};

export const CancelInviteAction: FC<Props> = ({ inviteId, close }) => {
  const [runMutation] = useAsyncMutation<CancelInviteActionMutation>({
    mutation: Mutation,
    expectedTypename: "CancelGroupInviteResult",
  });

  const act = async () => {
    await runMutation({
      variables: {
        input: { inviteId },
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
