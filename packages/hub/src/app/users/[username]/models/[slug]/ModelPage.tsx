import { graphql } from "relay-runtime";

import ModelPageQueryNode, {
  ModelPageQuery,
} from "@/__generated__/ModelPageQuery.graphql";

import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { usePreloadedQuery } from "react-relay";

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

export type PreloadedModelPageQuery = SerializablePreloadedQuery<
  typeof ModelPageQueryNode,
  ModelPageQuery
>;

export function useModelPageQuery(query: PreloadedModelPageQuery) {
  const queryRef = useSerializablePreloadedQuery(query);
  const { model: modelRef } = usePreloadedQuery(Query, queryRef);

  return modelRef;
}
