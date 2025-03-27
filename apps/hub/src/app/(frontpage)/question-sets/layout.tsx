import { PropsWithChildren } from "react";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";
import { LayoutActions } from "./LayoutActions";

export default async function QuestionSetsLayout({
  children,
}: PropsWithChildren) {
  return (
    <FrontpageMainAreaLayout title="Question Sets" actions={<LayoutActions />}>
      {children}
    </FrontpageMainAreaLayout>
  );
}
