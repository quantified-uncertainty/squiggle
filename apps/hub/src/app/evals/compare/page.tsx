import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { EvaluationDetails } from "@/evals/components/EvaluationDetails";
import { QuestionItem } from "@/evals/components/QuestionItem";
import { getEvalById } from "@/evals/data/detailsEvals";

import { RunSquiggle } from "../eval/[id]/RunSquiggle";

export default async function CompareEvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids: string }>;
}) {
  const { ids } = await searchParams;
  const evaluationIds = ids.split(",");

  if (evaluationIds.length !== 2) {
    return (
      <FullLayoutWithPadding>
        <div className="mb-6">
          <H1>Compare Evaluations</H1>
        </div>
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error: Invalid comparison request</p>
          <p className="mt-2">
            Please select exactly two evaluations to compare.
          </p>
        </div>
      </FullLayoutWithPadding>
    );
  }

  const evaluations = await Promise.all(
    evaluationIds.map((id) => getEvalById(id))
  );

  return (
    <FullLayoutWithPadding>
      <div className="mb-6">
        <H1>Compare Evaluations</H1>
      </div>

      <div className="flex gap-4">
        {evaluations.map((evaluation) => (
          <div key={evaluation.id} className="flex-1">
            <EvaluationDetails evaluation={evaluation} />
          </div>
        ))}
      </div>

      <div className="mt-8 divide-y divide-slate-200">
        {
          // take all questions from first evaluation - they should be the same on all evaluations (TODO: check?)
          evaluations[0].values.map((firstValue) => (
            <div key={firstValue.id} className="py-8">
              <QuestionItem question={firstValue.question} />
              <div className="flex gap-4 pt-2">
                {evaluations.map((evaluation) => {
                  const value = evaluation.values.find(
                    (v) => v.question.id === firstValue.question.id
                  );
                  return (
                    <div key={evaluation.id} className="flex-1">
                      {value ? (
                        <RunSquiggle code={value.code} />
                      ) : (
                        <p>No result</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        }
      </div>
    </FullLayoutWithPadding>
  );
}
