import QueryNode, {
  ModelExportPageQuery,
} from "@/__generated__/ModelExportPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { ModelExportPage } from "./ModelExportPage";

type Props = {
  params: { owner: string; slug: string; variableName: string };
};

export default async function OuterModelPage({ params }: Props) {
  const query = await loadPageQuery<ModelExportPageQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });

  return (
    <div className="py-4 px-8">
      <ModelExportPage query={query} params={params} />
    </div>
  );
}
