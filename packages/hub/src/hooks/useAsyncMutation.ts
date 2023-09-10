import { useMutation } from "react-relay";

import { useToast } from "@quri/ui";
import {
  GraphQLTaggedNode,
  MutationParameters,
  VariablesOf,
} from "relay-runtime";

export function useAsyncMutation<
  TMutation extends MutationParameters & {
    response: {
      readonly result:
        | {
            readonly __typename: "BaseError";
            readonly message: string;
          }
        | {
            readonly __typename: string;
          };
    };
  },
>({
  mutation,
  confirmation,
  expectedTypename,
}: {
  mutation: GraphQLTaggedNode;
  confirmation?: string;
  expectedTypename: string;
}) {
  const toast = useToast();

  const [runMutation] = useMutation<TMutation>(mutation);

  const act = ({
    variables,
    onCompleted,
  }: {
    variables: VariablesOf<TMutation>;
    onCompleted?: () => void; // TODO - pass response
  }): Promise<void> => {
    return new Promise((resolve, reject) => {
      runMutation({
        variables,
        onCompleted(response) {
          if (response.result.__typename === expectedTypename) {
            if (confirmation !== undefined) {
              toast(confirmation, "confirmation");
            }
            onCompleted?.();
            resolve();
          } else if (response.result.__typename === "BaseError") {
            toast(
              // this is more cautious than necessary, simple casting to any would be fine too, but it doesn't hurt
              (response.result as { message?: string })?.message ??
                "Internal error",
              "error"
            );
            reject();
          } else {
            toast("Unexpected response type", "error");
            reject();
          }
        },
        onError(e) {
          toast(e.toString(), "error");
          resolve();
        },
      });
    });
  };

  return [act];
}
