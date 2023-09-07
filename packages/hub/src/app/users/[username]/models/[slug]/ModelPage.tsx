import { graphql } from "relay-runtime";

import ModelPageQueryNode, {
  ModelPageQuery,
} from "@/__generated__/ModelPageQuery.graphql";

import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";

export const ModelPageFragment = graphql`
  fragment ModelPage on Model
  @argumentDefinitions(
    forRelativeValues: { type: "ModelRevisionForRelativeValuesInput" }
  ) {
    id
    slug
    isEditable
    ...EditModelExports_Model
    owner {
      ...Owner
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
  const [{ model: modelRef }] = usePageQuery(query, Query);

  return modelRef;
}
