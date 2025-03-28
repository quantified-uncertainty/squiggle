import { PropsWithChildren } from "react";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";

export default async function VariablesLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ username: string }> }>) {
  const { username } = await params;
  return (
    <MainAreaLayout title={`Variables by ${username}`}>
      {children}
    </MainAreaLayout>
  );
}
