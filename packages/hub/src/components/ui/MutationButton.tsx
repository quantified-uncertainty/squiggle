import { ReactNode } from "react";
import { UseMutationConfig } from "react-relay";
import { GraphQLTaggedNode, VariablesOf } from "relay-runtime";

import { Button } from "@quri/ui";

import {
  CommonMutationParameters,
  useAsyncMutation,
} from "@/hooks/useAsyncMutation";

type ButtonProps = Parameters<typeof Button>[0];

export function MutationButton<
  TMutation extends CommonMutationParameters<TTypename> = never,
  const TTypename extends string = never,
>({
  mutation,
  variables,
  updater,
  expectedTypename,
  title,
  theme = "default",
  size,
}: {
  mutation: GraphQLTaggedNode;
  variables: VariablesOf<TMutation>;
  updater?: UseMutationConfig<TMutation>["updater"];
  expectedTypename: TTypename;
  title: string;
  theme?: ButtonProps["theme"];
  size?: ButtonProps["size"];
}): ReactNode {
  const [runMutation, inFlight] = useAsyncMutation<TMutation>({
    mutation,
    expectedTypename,
  });

  const act = async () => {
    await runMutation({
      variables,
      updater,
    });
  };

  return (
    <Button onClick={act} disabled={inFlight} theme={theme} size={size}>
      {title}
    </Button>
  );
}
