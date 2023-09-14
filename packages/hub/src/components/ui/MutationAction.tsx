import { DropdownMenuAsyncActionItem, IconProps } from "@quri/ui";
import { FC, ReactNode } from "react";
import { GraphQLTaggedNode, OperationType, VariablesOf } from "relay-runtime";

import {
  CommonMutationParameters,
  useAsyncMutation,
} from "@/hooks/useAsyncMutation";
import { UseMutationConfig } from "react-relay";

type MaybeLazyVariablesOf<TQuery extends OperationType> =
  | VariablesOf<TQuery>
  // Note that this is less type-safe than variables object; extra values will be ignored.
  // TODO: I think this might be possible to fix with more advanced Typescript.
  // We could make this type a generic over function's return type and then compare it against
  // actual `VariablesOf` and throw `never` if there are extra keys).
  // Until that is fixed, plain `VariablesOf` should be preferred.
  | (() => VariablesOf<TQuery>);

function resolveVariables<TQuery extends OperationType>(
  variables: MaybeLazyVariablesOf<TQuery>
): VariablesOf<TQuery> {
  if (typeof variables === "function") {
    return variables();
  } else {
    return variables;
  }
}

export function MutationAction<
  TMutation extends CommonMutationParameters<TTypename> = never,
  const TTypename extends string = never,
>({
  mutation,
  variables,
  updater,
  expectedTypename,
  title,
  icon,
  close,
}: {
  mutation: GraphQLTaggedNode;
  variables: MaybeLazyVariablesOf<TMutation>;
  updater?: UseMutationConfig<TMutation>["updater"];
  expectedTypename: TTypename;
  title: string;
  icon?: FC<IconProps>;
  close: () => void;
}): ReactNode {
  const [runMutation] = useAsyncMutation<TMutation>({
    mutation,
    expectedTypename,
  });

  const act = async () => {
    await runMutation({
      variables: resolveVariables(variables),
      updater,
    });
  };

  return (
    <DropdownMenuAsyncActionItem
      title={title}
      onClick={act}
      icon={icon}
      close={close}
    />
  );
}
