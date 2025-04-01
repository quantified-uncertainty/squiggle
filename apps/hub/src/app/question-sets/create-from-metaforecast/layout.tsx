import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function CreateQuestionSetFromMetaforecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NarrowPageLayout>{children}</NarrowPageLayout>;
}
