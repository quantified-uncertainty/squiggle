import { EditModelPageBody } from "./EditModelPageBody";
import { loadModelPageQuery } from "./loadModelPageQuery";

export default async function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const query = await loadModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  return (
    <div className="bg-white">
      <EditModelPageBody query={query} />
    </div>
  );
}
