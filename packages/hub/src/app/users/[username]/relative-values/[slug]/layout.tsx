"use client";

import { ReactNode } from "react";

import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";

export default function ModelLayout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  return (
    <RelativeValuesDefinitionPage {...params}>
      {children}
    </RelativeValuesDefinitionPage>
  );
}
