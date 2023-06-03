"use client";

import { ReactNode } from "react";
import { ModelPage } from "./ModelPage";
import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";

export default function ModelLayout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  return (
    <FullLayoutWithPadding>
      <ModelPage {...params}>{children}</ModelPage>
    </FullLayoutWithPadding>
  );
}
