import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { EvaluationsTable } from "@/evals/components/EvaluationsTable";
import { QuestionSetActionsButton } from "@/evals/components/QuestionSetActionsButton";
import { getQuestionSetById } from "@/evals/data/questionSets";
import { getEvaluationsByQuestionSetId } from "@/evals/data/summaryEvals";
import { evaluationsRoute, questionSetsRoute } from "@/lib/routes";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const specList = await getQuestionSetById((await params).id);
    return {
      title: `${specList.name} - Squiggle Hub`,
    };
  } catch (error) {
    return {
      title: `Question Set: ${(await params).id} - Squiggle Hub`,
    };
  }
}

export default async function QuestionSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const questionSet = await getQuestionSetById(id);
  const evals = await getEvaluationsByQuestionSetId(id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <H2>{questionSet.name}</H2>
          <p className="text-sm text-gray-500">ID: {questionSet.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          <QuestionSetActionsButton
            questionSetId={questionSet.id}
            questionSetName={questionSet.name}
          />
          <StyledLink href={questionSetsRoute()}>
            ← Back to Question Sets
          </StyledLink>
        </div>
      </div>

      <Card theme="big">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Questions ({questionSet.questions.length})
          </h3>
        </div>

        {questionSet.questions.length === 0 ? (
          <p className="text-gray-500">This question set has no questions.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {questionSet.questions.map((questionItem) => (
              <li key={questionItem.question.id} className="py-4">
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    {questionItem.question.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {questionItem.question.id}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Evaluations ({evals.length})</h3>
          <StyledLink href={evaluationsRoute()}>
            View All Evaluations
          </StyledLink>
        </div>

        <EvaluationsTable
          evaluations={evals}
          showQuestionSet={false}
          emptyMessage="No evaluations found for this question set."
        />
      </div>
    </div>
  );
}
