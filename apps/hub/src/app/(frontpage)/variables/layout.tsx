import { PropsWithChildren } from "react";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default function VariablesLayout({ children }: PropsWithChildren) {
  return <MainAreaLayout title="Variables">{children}</MainAreaLayout>;
}
