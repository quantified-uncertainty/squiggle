import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { getEvalById } from "@quri/evals";

import { Link } from "@/components/ui/Link";

import { RunSquiggle } from "./RunSquiggle";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return {
    title: `Evaluation: ${(await params).id} - Squiggle Hub`,
  };
}

export default async function EvalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const evaluation = await getEvalById((await params).id);

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Evaluation: {evaluation.id}</h2>
          <Link
            href="/speclists/evals"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Evaluations
          </Link>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium">Evaluation Details</h3>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">ID</p>
              <p className="text-sm">{evaluation.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Created</p>
              <p className="text-sm">
                {format(new Date(evaluation.createdAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Evaluator</p>
              <p className="text-sm">{evaluation.evaluator}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Spec List</p>
              <p className="text-sm">
                <Link
                  href={`/speclists/${evaluation.specList.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {evaluation.specList.id}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Results</p>
              <p className="text-sm">{evaluation.evalResults.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium">Evaluation Results</h3>
          {evaluation.evalResults.length === 0 ? (
            <p className="text-gray-500">
              No results found for this evaluation.
            </p>
          ) : (
            <div className="space-y-8">
              {evaluation.evalResults.map((result) => (
                <div key={result.id} className="border-b pb-6">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {result.spec.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {result.spec.id}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Squiggle Model:
                    </p>
                    <RunSquiggle code={result.code} />
                  </div>

                  {result.workflow && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        AI Summary:
                      </p>
                      <div className="max-h-40 overflow-auto rounded bg-gray-50 p-3 text-sm">
                        {result.workflow.markdown || "No summary available."}
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/ai/${result.workflow.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                          target="_blank"
                        >
                          View full AI workflow →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading evaluation:", error);
    notFound();
  }
}
