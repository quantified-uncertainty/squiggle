import { Metadata } from "next";
import { ReactNode, Suspense } from "react";

import ModelLayoutQueryNode, {
  ModelLayoutQuery,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { FallbackModelLayout } from "./FallbackLayout";
import { ModelLayout } from "./ModelLayout";

type Props = {
  params: { username: string; slug: string };
  children: ReactNode;
};

async function LoadedLayout({ params, children }: Props) {
  const query = await loadSerializableQuery<
    typeof ModelLayoutQueryNode,
    ModelLayoutQuery
  >(ModelLayoutQueryNode.params, {
    input: { owner: { username: params.username }, slug: params.slug },
  });

  return <ModelLayout query={query}>{children}</ModelLayout>;
}

export default function Layout({ params, children }: Props) {
  return (
    <Suspense
      fallback={
        <FallbackModelLayout username={params.username} slug={params.slug} />
      }
    >
      <LoadedLayout params={params}>{children}</LoadedLayout>
    </Suspense>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: `${params.username}/${params.slug}` };
}
