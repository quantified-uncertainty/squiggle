import { PropsWithChildren } from "react";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";

export default async function DefinitionsLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ username: string }> }>) {
  const { username } = await params;
  return (
    <MainAreaLayout title={`Definitions by ${username}`}>
      {children}
    </MainAreaLayout>
  );
}
