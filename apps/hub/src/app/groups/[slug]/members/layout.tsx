import { PropsWithChildren } from "react";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";

export default async function OuterGroupMembersLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  return (
    <MainAreaLayout title={`Members of ${slug}`}>{children}</MainAreaLayout>
  );
}
