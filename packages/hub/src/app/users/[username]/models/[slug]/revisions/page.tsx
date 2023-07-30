import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { ModelRevisionsList } from "./ModelRevisionsList";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import QueryNode, {
  ModelRevisionsListQuery,
} from "@/__generated__/ModelRevisionsListQuery.graphql";

export default async function ModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const query = await loadSerializableQuery<
    typeof QueryNode,
    ModelRevisionsListQuery
  >(QueryNode.params, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  return (
    <NarrowPageLayout>
      <ModelRevisionsList query={query} />
    </NarrowPageLayout>
  );
}
