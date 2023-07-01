import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import {
  ModelPageQuery,
  ModelRevisionForRelativeValuesInput,
  QueryModelInput,
} from "@/__generated__/ModelPageQuery.graphql";

export const ModelPageFragment = graphql`
  fragment ModelPage on Model
  @argumentDefinitions(
    forRelativeValues: { type: "ModelRevisionForRelativeValuesInput" }
  ) {
    id
    slug
    owner {
      username
    }
    currentRevision {
      content {
        __typename
      }
      ...ModelRevision @arguments(forRelativeValues: $forRelativeValues)
    }
  }
`;

const Query = graphql`
  query ModelPageQuery(
    $input: QueryModelInput!
    $forRelativeValues: ModelRevisionForRelativeValuesInput
  ) {
    model(input: $input) {
      ...ModelPage @arguments(forRelativeValues: $forRelativeValues)
      ...FixModelUrlCasing
    }
  }
`;

// This is a common query used in multiple nested pages, but it should be de-duped by Next.js caching mechanisms.
export function useModelPageQuery(
  input: QueryModelInput,
  forRelativeValues?: ModelRevisionForRelativeValuesInput
) {
  const { model: modelRef } = useLazyLoadQuery<ModelPageQuery>(Query, {
    input,
    forRelativeValues,
  });

  return modelRef;
}
