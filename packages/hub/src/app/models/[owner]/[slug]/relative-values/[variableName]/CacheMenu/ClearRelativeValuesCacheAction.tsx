"use strict";
import { FC } from "react";
import { graphql } from "react-relay";

import { DropdownMenuAsyncActionItem, TrashIcon } from "@quri/ui";

import { ClearRelativeValuesCacheActionMutation } from "@/__generated__/ClearRelativeValuesCacheActionMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";

export const Mutation = graphql`
  mutation ClearRelativeValuesCacheActionMutation(
    $input: MutationClearRelativeValuesCacheInput!
  ) {
    result: clearRelativeValuesCache(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on ClearRelativeValuesCacheResult {
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

export const ClearRelativeValuesCacheAction: FC<{
  exportId: string;
  close(): void;
}> = ({ exportId, close }) => {
  // TODO - clear cache in ModelEvaluator and re-render
  const [runMutation] =
    useAsyncMutation<ClearRelativeValuesCacheActionMutation>({
      mutation: Mutation,
      confirmation: "Cache cleared",
      expectedTypename: "ClearRelativeValuesCacheResult",
    });

  const act = () =>
    runMutation({
      variables: {
        input: { exportId },
      },
    });

  return (
    <DropdownMenuAsyncActionItem
      title="Clear cache"
      icon={TrashIcon}
      onClick={act}
      close={close}
    />
  );
};
