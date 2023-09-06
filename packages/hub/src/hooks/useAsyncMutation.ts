import { UseMutationConfig, useMutation } from "react-relay";

import { useToast } from "@quri/ui";
import { useState } from "react";
import { GraphQLTaggedNode, MutationParameters } from "relay-runtime";

/**
 * Like the basic `useMutation`, this function returns a `[runMutation, isMutationInFlight]` pair.
 * But unlike `useMutation`, returned `runMutation` is async and has more convenient `onCompleted` callback (it receives only an expected fragment, unwrapped from the result union).
 * Also, all errors will be displayed as notifications automatically.
 */
export function useAsyncMutation<
  TMutation extends MutationParameters & {
    response: {
      readonly result:
        | {
            readonly __typename: "BaseError";
            readonly message: string;
          }
        | {
            readonly __typename: TTypename;
          }
        | {
            readonly __typename: "%other";
          };
    };
  },
  TTypename extends string = string
>({
  mutation,
  confirmation,
  expectedTypename,
  blockOnSuccess,
}: {
  mutation: GraphQLTaggedNode;
  confirmation?: string;
  expectedTypename: TTypename;
  blockOnSuccess?: boolean; // mark mutation as in flight on success; useful if `onCompleted` callback does `router.push`
}) {
  const toast = useToast();

  const [runMutation, inFlight] = useMutation<TMutation>(mutation);
  const [wasCompleted, setWasCompleted] = useState(false);

  type OkResult = Extract<
    TMutation["response"]["result"],
    { __typename: TTypename }
  >;

  const act = (
    config: Omit<UseMutationConfig<TMutation>, "onCompleted" | "onError"> & {
      onCompleted?: (okResult: OkResult) => void;
    }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      runMutation({
        ...config,
        onCompleted(response) {
          if (response.result.__typename === expectedTypename) {
            if (confirmation !== undefined) {
              toast(confirmation, "confirmation");
            }
            setWasCompleted(true);
            config.onCompleted?.(response.result as OkResult);
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

  return [act, inFlight || Boolean(blockOnSuccess && wasCompleted)] as const;
}
