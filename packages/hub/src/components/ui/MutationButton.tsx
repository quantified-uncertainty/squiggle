import { ReactNode } from "react";
import { UseMutationConfig } from "react-relay";
import { GraphQLTaggedNode, VariablesOf } from "relay-runtime";

import { Button } from "@quri/ui";

import {
  CommonMutationParameters,
  useAsyncMutation,
} from "@/hooks/useAsyncMutation";

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
}: {
  mutation: GraphQLTaggedNode;
  variables: VariablesOf<TMutation>;
  updater?: UseMutationConfig<TMutation>["updater"];
  expectedTypename: TTypename;
  title: string;
  theme?: "default" | "primary"; // TODO - extract type from <Button>
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
    <Button onClick={act} disabled={inFlight} theme={theme}>
      {title}
    </Button>
  );
}
