import React from "react";

import { EvaluationsTable } from "@/evals/components/EvaluationsTable";
import { getAllEvaluations } from "@/evals/data/summaryEvals";

export const metadata = {
  title: "Evaluations - Squiggle Hub",
};

export default async function EvalsPage() {
  const evals = await getAllEvaluations();

  return (
    <EvaluationsTable
      evaluations={evals}
      emptyMessage="No evaluations found. You can produce new evaluations running some epistemic agent on a question set."
    />
  );
}
