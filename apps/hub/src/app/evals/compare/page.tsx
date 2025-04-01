import { ErrorBox } from "@/components/ui/ErrorBox";
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
      <ErrorBox>Please select exactly two evaluations to compare.</ErrorBox>
    );
  }

  const evaluations = await Promise.all(
    evaluationIds.map((id) => getEvalById(id))
  );

  const questionSetIds = evaluations.map((e) => e.questionSet.id);
  if (questionSetIds.some((id) => id !== questionSetIds[0])) {
    return (
      <ErrorBox>Please select evaluations from the same question set.</ErrorBox>
    );
  }

  return (
    <div>
      <div className="flex gap-4">
        {evaluations.map((evaluation) => (
          <div key={evaluation.id} className="flex-1">
            <EvaluationDetails evaluation={evaluation} linkToEvaluation />
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
    </div>
  );
}
