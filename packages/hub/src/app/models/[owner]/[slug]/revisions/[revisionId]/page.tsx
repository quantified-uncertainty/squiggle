import { loadPageQuery } from "@/relay/loadPageQuery";
import { ModelRevisionView } from "./ModelRevisionView";
import QueryNode, {
  ModelRevisionViewQuery,
} from "@/__generated__/ModelRevisionViewQuery.graphql";

export default async function ModelPage({
  params,
}: {
  params: { owner: string; slug: string; revisionId: string };
}) {
  const query = await loadPageQuery<ModelRevisionViewQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
    revisionId: params.revisionId,
  });

  return <ModelRevisionView query={query} />;
}
