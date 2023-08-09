import QueryNode, {
  StatusPageQuery,
} from "@/__generated__/StatusPageQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { StatusPage } from "./StatusPage";

export default async function OuterFrontPage() {
  const query = await loadSerializableQuery<typeof QueryNode, StatusPageQuery>(
    QueryNode.params,
    {}
  );

  return (
    <NarrowPageLayout>
      <StatusPage query={query} />
    </NarrowPageLayout>
  );
}
