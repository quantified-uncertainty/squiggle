import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

export default async function Page({
  params,
}: {
  params: { owner: string; slug: string };
}) {
  const query = await loadPageQuery<RelativeValuesDefinitionPageQuery>(
    QueryNode,
    {
      input: { owner: params.owner, slug: params.slug },
    }
  );

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition query={query} />
    </NarrowPageLayout>
  );
}
