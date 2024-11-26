import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { EditModelPage } from "./EditModelPage";

import QueryNode, {
  EditModelPageQuery,
} from "@/__generated__/EditModelPageQuery.graphql";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

async function InnerPage({ params }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<EditModelPageQuery>(QueryNode, {
    input: { owner, slug },
  });

  return (
    <div className="bg-white">
      <EditModelPage query={query} />
    </div>
  );
}

const Loading = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 border-r p-1">
        <Skeleton className="h-full" />
      </div>
      <div className="flex-1 p-1">
        <Skeleton className="h-full" />
      </div>
    </div>
  );
};

export default async function Page({ params }: Props) {
  return (
    <div className="bg-white">
      {/* Intentionally not using loading.tsx here, because this route has sub-routes where that doesn't make sense. */}
      <Suspense fallback={<Loading />}>
        <InnerPage params={params} />
      </Suspense>
    </div>
  );
}
