import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren, Suspense } from "react";

import { isModelEditable, loadModelCard } from "@/server/models/data";

import { FallbackModelLayout } from "./FallbackLayout";
import { ModelLayout } from "./ModelLayout";

type Props = PropsWithChildren<{
  params: Promise<{ owner: string; slug: string }>;
}>;

async function LoadedLayout({ params, children }: Props) {
  const { owner, slug } = await params;
  const model = await loadModelCard({ owner, slug });
  if (!model) {
    notFound();
  }

  const isEditable = await isModelEditable(model);

  return (
    <ModelLayout model={model} isEditable={isEditable}>
      {children}
    </ModelLayout>
  );
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
