import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function QuestionSetCreateLayout({
  children,
}: PropsWithChildren) {
  return <NarrowPageLayout>{children}</NarrowPageLayout>;
}
