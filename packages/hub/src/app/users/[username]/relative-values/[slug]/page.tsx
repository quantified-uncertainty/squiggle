import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";

type Props = {
  params: { username: string; slug: string };
};

export default async function OuterDefinitionPage({ params }: Props) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const query = await loadSerializableQuery<
    typeof QueryNode,
    RelativeValuesDefinitionPageQuery
  >(QueryNode.params, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  return <RelativeValuesDefinitionPage query={query} />;
}
