import ModelPageQueryNode, {
  ModelPageQuery,
  ModelRevisionForRelativeValuesInput,
  QueryModelInput,
} from "@/__generated__/ModelPageQuery.graphql";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { PreloadedModelPageQuery } from "./ModelPage";

// This is a common query used in multiple nested pages, but it should be de-duped by Next.js caching mechanisms.
export async function loadModelPageQuery(
  input: QueryModelInput,
  forRelativeValues?: ModelRevisionForRelativeValuesInput
): Promise<PreloadedModelPageQuery> {
  const query = await loadSerializableQuery<
    typeof ModelPageQueryNode,
    ModelPageQuery
  >(ModelPageQueryNode.params, {
    input,
    forRelativeValues: forRelativeValues ?? null, // important for relay caches
  });

  return query;
}
