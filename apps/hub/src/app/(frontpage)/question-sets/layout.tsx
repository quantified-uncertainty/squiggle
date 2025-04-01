import { PropsWithChildren } from "react";

import { QuestionSetsHelp } from "@/app/evals/QuestionSetsHelp";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";
import { LayoutActions } from "./LayoutActions";

export default async function QuestionSetsLayout({
  children,
}: PropsWithChildren) {
  return (
    <MainAreaLayout
      help={<QuestionSetsHelp />}
      title="Question Sets"
      actions={<LayoutActions />}
    >
      {children}
    </MainAreaLayout>
  );
}
