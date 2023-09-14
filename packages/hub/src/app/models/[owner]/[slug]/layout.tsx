import { Metadata } from "next";
import { ReactNode, Suspense } from "react";

import ModelLayoutQueryNode, {
  ModelLayoutQuery,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { FallbackModelLayout } from "./FallbackLayout";
import { ModelLayout } from "./ModelLayout";

type Props = {
  params: { owner: string; slug: string };
  children: ReactNode;
};

async function LoadedLayout({ params, children }: Props) {
  const query = await loadPageQuery<ModelLayoutQuery>(ModelLayoutQueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });

  return <ModelLayout query={query}>{children}</ModelLayout>;
}

export default function Layout({ params, children }: Props) {
  return (
    <Suspense
      fallback={
        <FallbackModelLayout username={params.owner} slug={params.slug} />
      }
    >
      <LoadedLayout params={params}>{children}</LoadedLayout>
    </Suspense>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: `${params.owner}/${params.slug}` };
}
