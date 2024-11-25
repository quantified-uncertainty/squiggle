import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<RelativeValuesDefinitionPageQuery>(
    QueryNode,
    {
      input: { owner, slug },
    }
  );

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition query={query} />
    </NarrowPageLayout>
  );
}
