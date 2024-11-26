import { loadPageQuery } from "@/relay/loadPageQuery";

import { ModelRevisionsList } from "./ModelRevisionsList";

import QueryNode, {
  ModelRevisionsListQuery,
} from "@/__generated__/ModelRevisionsListQuery.graphql";

export default async function ModelPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<ModelRevisionsListQuery>(QueryNode, {
    input: { owner, slug },
  });

  return <ModelRevisionsList query={query} />;
}
