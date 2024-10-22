import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

import { source } from "@/app/source";

import { baseOptions } from "../../layout.config";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions} tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
