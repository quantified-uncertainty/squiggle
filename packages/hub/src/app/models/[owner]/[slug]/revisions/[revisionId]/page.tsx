import { loadPageQuery } from "@/relay/loadPageQuery";

import { ModelRevisionView } from "./ModelRevisionView";

import QueryNode, {
  ModelRevisionViewQuery,
} from "@/__generated__/ModelRevisionViewQuery.graphql";

export default async function ModelPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string; revisionId: string }>;
}) {
  const { owner, slug, revisionId } = await params;
  const query = await loadPageQuery<ModelRevisionViewQuery>(QueryNode, {
    input: { owner, slug },
    revisionId,
  });

  return <ModelRevisionView query={query} />;
}
