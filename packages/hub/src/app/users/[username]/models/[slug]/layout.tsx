"use client";

import { ReactNode } from "react";
import { ModelPage } from "./ModelPage";

export default function ModelLayout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  return (
    <div className="pt-4">
      <ModelPage {...params}>{children}</ModelPage>
    </div>
  );
}
