import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";
import { Button } from "@quri/ui";

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
};

export const DeleteModelButton: FC<Props> = ({ username, slug }) => {
  const router = useRouter();

  const [mutation, isMutationInFlight] =
    useMutation<DeleteModelButtonMutation>(Mutation);

  const [error, setError] = useState("");

  const onClick = useCallback(() => {
    mutation({
      variables: { input: { username, slug } },
      onCompleted(response) {
        console.log("onCompleted", response);
        if (response.deleteModel.__typename === "BaseError") {
          setError(response.deleteModel.message);
        } else {
          router.push("/");
        }
      },
      onError(e) {
        setError(e.toString());
      },
    });
  }, [mutation, username, slug, router]);

  return (
    <div className="flex gap-2 items-center">
      <Button onClick={onClick}>Delete</Button>
      {error && <div className="text-xs text-red-700">{error}</div>}
    </div>
  );
};
