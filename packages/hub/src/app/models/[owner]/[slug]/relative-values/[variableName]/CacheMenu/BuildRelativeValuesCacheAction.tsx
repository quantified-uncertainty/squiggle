"use client";
import { FC } from "react";
import { graphql } from "react-relay";

import { DropdownMenuAsyncActionItem, RefreshIcon } from "@quri/ui";

import { BuildRelativeValuesCacheActionMutation } from "@/__generated__/BuildRelativeValuesCacheActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";

export const Mutation = graphql`
  mutation BuildRelativeValuesCacheActionMutation(
    $input: MutationBuildRelativeValuesCacheInput!
  ) {
    result: buildRelativeValuesCache(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on BuildRelativeValuesCacheResult {
        relativeValuesExport {
          id
          cache {
            firstItem
            secondItem
            resultJSON
            errorString
          }
        }
      }
    }
  }
`;

export const BuildRelativeValuesCacheAction: FC<{
  exportId: string;
  close(): void;
}> = ({ exportId, close }) => {
  // TODO - fill cache in ModelEvaluator and re-render
  const [runMutation] =
    useAsyncMutation<BuildRelativeValuesCacheActionMutation>({
      mutation: Mutation,
      confirmation: "Cache filled",
      expectedTypename: "BuildRelativeValuesCacheResult",
    });

  const act = () => runMutation({ variables: { input: { exportId } } });

  return (
    <DropdownMenuAsyncActionItem
      title="Fill cache"
      icon={RefreshIcon}
      onClick={act}
      close={close}
    />
  );
};
