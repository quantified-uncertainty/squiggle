import { useRouter } from "next/navigation";
import { FC, useCallback } from "react";
import { useFragment, useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";

import { ownerRoute } from "@/routes";

import { DeleteModelAction$key } from "@/__generated__/DeleteModelAction.graphql";
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
  model: DeleteModelAction$key;
  close(): void;
};

export const DeleteModelAction: FC<Props> = ({ model: modelKey, close }) => {
  const model = useFragment(
    graphql`
      fragment DeleteModelAction on Model {
        slug
        owner {
          __typename
          id
          slug
        }
      }
    `,
    modelKey
  );

  const router = useRouter();

  const [mutation] = useMutation<DeleteModelActionMutation>(Mutation);

  const toast = useToast();

  const onClick = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      mutation({
        variables: { input: { owner: model.owner.slug, slug: model.slug } },
        onCompleted(response) {
          if (response.deleteModel.__typename === "BaseError") {
            toast(response.deleteModel.message, "error");
            resolve();
          } else {
            // TODO - this is risky, what if we add more error types to GraphQL schema?
            router.push(ownerRoute(model.owner));
          }
        },
        onError(e) {
          toast(e.toString(), "error");
          resolve();
        },
      });
    });
  }, [mutation, model.owner, model.slug, router, toast]);

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={onClick}
      icon={TrashIcon}
      close={close}
    />
  );
};
