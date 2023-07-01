"use client";

import { ReactNode } from "react";
import { ModelLayout } from "./ModelLayout";

export default function Layout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  return <ModelLayout {...params}>{children}</ModelLayout>;
}
