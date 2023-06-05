import { useRouter } from "next/navigation";
import { FC, useCallback } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";

import { DeleteRelativeValuesDefinitionActionMutation } from "@/__generated__/DeleteRelativeValuesDefinitionActionMutation.graphql";

const Mutation = graphql`
  mutation DeleteRelativeValuesDefinitionActionMutation(
    $input: MutationDeleteRelativeValuesDefinitionInput!
  ) {
    result: deleteRelativeValuesDefinition(input: $input) {
      __typename
      ... on BaseError {
        message
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
  close(): void;
};

export const DeleteDefinitionAction: FC<Props> = ({
  username,
  slug,
  close,
}) => {
  const router = useRouter();

  const [mutation] =
    useMutation<DeleteRelativeValuesDefinitionActionMutation>(Mutation);

  const toast = useToast();

  const onClick = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      mutation({
        variables: { input: { username, slug } },
        onCompleted(response) {
          if (response.result.__typename === "BaseError") {
            toast(response.result.message, "error");
            close();
          } else {
            router.push("/");
          }
        },
        onError(e) {
          toast(e.toString(), "error");
          close();
        },
      });
    });
  }, [mutation, username, slug, close, router, toast]);

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={onClick}
      icon={TrashIcon}
      close={close}
    />
  );
};
