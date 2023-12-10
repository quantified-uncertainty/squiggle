import { ReactNode } from "react";
import { GraphQLTaggedNode } from "relay-runtime";

import { Button } from "@quri/ui";

import {
  CommonMutationParameters,
  useAsyncMutation,
  UseAsyncMutationAct,
} from "@/hooks/useAsyncMutation";

/*
 * Props for this component include:
 * - some props that are passed to `<Button>`
 * - params for `useAsyncMutation` hook
 * - params for `runMutation` call on click
 */
export function MutationButton<
  TMutation extends CommonMutationParameters<TTypename> = never,
  const TTypename extends string = never,
>({
  mutation,
  expectedTypename,
  title,
  // button props
  theme,
  size,
  // runMutation params
  variables,
  updater,
  onCompleted,
}: {
  mutation: GraphQLTaggedNode;
  expectedTypename: TTypename;
  title: string;
} & Pick<Parameters<typeof Button>[0], "theme" | "size"> &
  Pick<
    Parameters<UseAsyncMutationAct<TMutation, TTypename>>[0],
    "variables" | "updater" | "onCompleted"
  >): ReactNode {
  const [runMutation, inFlight] = useAsyncMutation<TMutation, TTypename>({
    mutation,
    expectedTypename,
  });

  const act = async () => {
    await runMutation({
      variables,
      updater,
      onCompleted,
    });
  };

  return (
    <Button onClick={act} disabled={inFlight} theme={theme} size={size}>
      {title}
    </Button>
  );
}
