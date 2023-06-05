"use client";

import { ReactNode } from "react";

import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";
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
      <RelativeValuesDefinitionPage {...params}>
        {children}
      </RelativeValuesDefinitionPage>
    </FullLayoutWithPadding>
  );
}
