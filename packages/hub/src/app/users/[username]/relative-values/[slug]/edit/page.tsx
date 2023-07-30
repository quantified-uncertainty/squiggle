import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

export default async function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const query = await loadSerializableQuery<
    typeof QueryNode,
    RelativeValuesDefinitionPageQuery
  >(QueryNode.params, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition query={query} />
    </NarrowPageLayout>
  );
}
