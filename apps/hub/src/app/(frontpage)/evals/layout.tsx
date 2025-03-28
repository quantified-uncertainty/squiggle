import { PropsWithChildren } from "react";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default function EvalsLayout({ children }: PropsWithChildren) {
  return (
    <MainAreaLayout title="Evaluations" theme="wide">
      {children}
    </MainAreaLayout>
  );
}
