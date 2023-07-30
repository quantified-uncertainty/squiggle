import { ViewModelRevision } from "../ViewModelRevision";
import { loadModelPageQuery } from "../loadModelPageQuery";

export default async function OuterModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const query = await loadModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  return (
    <div className="py-4 px-8">
      <ViewModelRevision query={query} />
    </div>
  );
}
