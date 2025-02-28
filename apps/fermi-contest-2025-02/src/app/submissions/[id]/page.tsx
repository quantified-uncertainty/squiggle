import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { getEvaluationById, getSubmissionById } from "../../lib/data";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubmissionPage({ params }: Props) {
  const { id } = await params;
  const submission = await getSubmissionById(id);
  const evaluation = await getEvaluationById(id);

  if (!submission) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/submissions" className="text-blue-600 hover:underline">
          ← Back to All Submissions
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h1 className="text-2xl font-bold">{submission.author}</h1>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">Model</h2>
            <div className="prose prose-sm max-w-none overflow-auto rounded-lg bg-gray-50 p-4">
              <ReactMarkdown>{submission.text}</ReactMarkdown>
            </div>
          </div>

          {evaluation && (
            <div className="mt-8 border-t pt-6">
              <h2 className="mb-4 text-xl font-semibold">Evaluation Results</h2>

              <div className="mb-4 flex items-center">
                <div className="mr-3 text-2xl font-bold">
                  {evaluation.finalScore.toFixed(1)}
                </div>
                <div className="text-gray-600">Final Score</div>
                {evaluation.goodhartingPenalty > 0 && (
                  <div className="ml-4 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                    {(evaluation.goodhartingPenalty * 100).toFixed(0)}% Penalty
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(evaluation.scores).map(
                  ([key, score]: [any, any]) => (
                    <div key={key} className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-2 flex justify-between">
                        <div className="font-medium">{score.criterionName}</div>
                        <div className="font-bold">
                          {score.score.toFixed(1)}/10
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {score.explanation.length > 200
                          ? `${score.explanation.substring(0, 200)}...`
                          : score.explanation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
