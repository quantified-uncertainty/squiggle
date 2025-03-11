import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { getEvalById } from "@quri/evals";

import { StyledLink } from "@/components/ui/StyledLink";
import { evaluationsRoute, speclistRoute } from "@/lib/routes";

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
          <StyledLink href={evaluationsRoute()}>
            ← Back to Evaluations
          </StyledLink>
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
                <StyledLink
                  href={speclistRoute({ id: evaluation.specList.id })}
                >
                  {evaluation.specList.id}
                </StyledLink>
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
                      <StyledLink
                        href={`/ai/${result.workflow.id}`} // FIXME - no such route
                        target="_blank"
                      >
                        View full AI workflow →
                      </StyledLink>
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
