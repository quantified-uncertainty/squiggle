import { PropsWithChildren } from "react";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default function DefinitionsLayout({ children }: PropsWithChildren) {
  return <MainAreaLayout title="Definitions">{children}</MainAreaLayout>;
}
