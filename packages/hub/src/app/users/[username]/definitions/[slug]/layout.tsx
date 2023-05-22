"use client";

import { ReactNode } from "react";

import { DefinitionPage } from "./DefinitionPage";
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
      <DefinitionPage {...params}>{children}</DefinitionPage>
    </FullLayoutWithPadding>
  );
}
