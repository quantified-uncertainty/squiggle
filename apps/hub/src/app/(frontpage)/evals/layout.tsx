import { PropsWithChildren } from "react";

import { EvaluationsHelp } from "@/app/evals/EvaluationsHelp";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default function EvalsLayout({ children }: PropsWithChildren) {
  return (
    <MainAreaLayout help={<EvaluationsHelp />} title="Evaluations" theme="wide">
      {children}
    </MainAreaLayout>
  );
}
