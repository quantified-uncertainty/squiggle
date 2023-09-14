import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { ModelRevisionsList } from "./ModelRevisionsList";
import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  ModelRevisionsListQuery,
} from "@/__generated__/ModelRevisionsListQuery.graphql";

export default async function ModelPage({
  params,
}: {
  params: { owner: string; slug: string };
}) {
  const query = await loadPageQuery<ModelRevisionsListQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });

  return (
    <NarrowPageLayout>
      <ModelRevisionsList query={query} />
    </NarrowPageLayout>
  );
}
