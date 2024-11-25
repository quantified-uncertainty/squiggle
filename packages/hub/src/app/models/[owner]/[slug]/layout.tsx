import { Metadata } from "next";
import { PropsWithChildren, Suspense } from "react";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { FallbackModelLayout } from "./FallbackLayout";
import { ModelLayout } from "./ModelLayout";

import ModelLayoutQueryNode, {
  ModelLayoutQuery,
} from "@/__generated__/ModelLayoutQuery.graphql";

type Props = PropsWithChildren<{
  params: Promise<{ owner: string; slug: string }>;
}>;

async function LoadedLayout({ params, children }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<ModelLayoutQuery>(ModelLayoutQueryNode, {
    input: { owner, slug },
  });

  return <ModelLayout query={query}>{children}</ModelLayout>;
}

export default async function Layout({ params, children }: Props) {
  const { owner, slug } = await params;
  return (
    <Suspense fallback={<FallbackModelLayout username={owner} slug={slug} />}>
      <LoadedLayout params={params}>{children}</LoadedLayout>
    </Suspense>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, slug } = await params;
  return { title: `${owner}/${slug}` };
}
