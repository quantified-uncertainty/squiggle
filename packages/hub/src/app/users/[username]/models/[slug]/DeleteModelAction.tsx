import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { DeleteModelActionMutation } from "@/__generated__/DeleteModelActionMutation.graphql";

const Mutation = graphql`
  mutation DeleteModelActionMutation($input: MutationDeleteModelInput!) {
    deleteModel(input: $input) {
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

export const DeleteModelAction: FC<Props> = ({ username, slug, close }) => {
  const router = useRouter();

  const [mutation, isMutationInFlight] =
    useMutation<DeleteModelActionMutation>(Mutation);

  const toast = useToast();

  const onClick = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      mutation({
        variables: { input: { username, slug } },
        onCompleted(response) {
          if (response.deleteModel.__typename === "BaseError") {
            toast(response.deleteModel.message, "error");
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
