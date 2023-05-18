import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { DeleteModelButtonMutation } from "@/__generated__/DeleteModelButtonMutation.graphql";

const Mutation = graphql`
  mutation DeleteModelButtonMutation($input: MutationDeleteModelInput!) {
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
    useMutation<DeleteModelButtonMutation>(Mutation);

  const [error, setError] = useState("");

  const onClick = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      mutation({
        variables: { input: { username, slug } },
        onCompleted(response) {
          if (response.deleteModel.__typename === "BaseError") {
            setError(response.deleteModel.message);
            close();
          } else {
            router.push("/");
          }
        },
        onError(e) {
          setError(e.toString());
          close();
        },
      });
    });
  }, [mutation, username, slug, close, router]);

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={onClick}
      icon={TrashIcon}
      close={close}
    />
  );
};
