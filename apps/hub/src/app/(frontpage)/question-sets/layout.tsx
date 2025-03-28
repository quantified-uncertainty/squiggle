import { PropsWithChildren } from "react";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";
import { LayoutActions } from "./LayoutActions";

export default async function QuestionSetsLayout({
  children,
}: PropsWithChildren) {
  return (
    <MainAreaLayout title="Question Sets" actions={<LayoutActions />}>
      {children}
    </MainAreaLayout>
  );
}
