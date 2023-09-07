import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";
import { useRouter } from "next/navigation";
import { FC, useCallback } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { DeleteModelActionMutation } from "@/__generated__/DeleteModelActionMutation.graphql";
import { Owner$key } from "@/__generated__/Owner.graphql";
import { useOwnerForInput } from "@/hooks/Owner";

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
  owner: Owner$key;
  slug: string;
  close(): void;
};

export const DeleteModelAction: FC<Props> = ({ owner, slug, close }) => {
  const router = useRouter();

  const [mutation] = useMutation<DeleteModelActionMutation>(Mutation);

  const toast = useToast();

  const ownerInput = useOwnerForInput(owner);

  const onClick = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      mutation({
        variables: { input: { owner: ownerInput, slug } },
        onCompleted(response) {
          if (response.deleteModel.__typename === "BaseError") {
            toast(response.deleteModel.message, "error");
            resolve();
          } else {
            // TODO - this is risky, what if we add more error types to GraphQL schema?
            router.push("/");
          }
        },
        onError(e) {
          toast(e.toString(), "error");
          resolve();
        },
      });
    });
  }, [mutation, ownerInput, slug, router, toast]);

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={onClick}
      icon={TrashIcon}
      close={close}
    />
  );
};
