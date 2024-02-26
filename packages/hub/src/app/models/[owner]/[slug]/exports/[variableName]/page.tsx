import { loadPageQuery } from "@/relay/loadPageQuery";

import { ModelExportPage } from "./ModelExportPage";

import QueryNode, {
  ModelExportPageQuery,
} from "@/__generated__/ModelExportPageQuery.graphql";

type Props = {
  params: { owner: string; slug: string; variableName: string };
};

export default async function OuterModelExportPage({ params }: Props) {
  const query = await loadPageQuery<ModelExportPageQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
    variableName: params.variableName,
  });

  return (
    <div className="py-4 px-8">
      <ModelExportPage query={query} params={params} />
    </div>
  );
}
