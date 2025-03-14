import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { Table } from "@quri/ui";

import { StyledLink } from "@/components/ui/StyledLink";
import { EvalWithDetailsDTO, getEvalById } from "@/evals/data/evals";
import { evaluationsRoute, evaluatorRoute, speclistRoute } from "@/lib/routes";

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
  let evaluation: EvalWithDetailsDTO;
  try {
    evaluation = await getEvalById((await params).id);
  } catch (error) {
    console.error("Error loading evaluation:", error);
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Evaluation: {evaluation.id}</h2>
        <StyledLink href={evaluationsRoute()}>← Back to Evaluations</StyledLink>
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
            <p className="text-sm">
              <StyledLink
                href={evaluatorRoute({ id: evaluation.evaluator.id })}
              >
                {evaluation.evaluator.name}
              </StyledLink>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Spec List</p>
            <p className="text-sm">
              <StyledLink href={speclistRoute({ id: evaluation.specList.id })}>
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
          <p className="text-gray-500">No results found for this evaluation.</p>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <Table.Header>
                <Table.HeaderCell className="w-2/5">
                  Spec Description
                </Table.HeaderCell>
                <Table.HeaderCell className="w-3/5">
                  Squiggle Result
                </Table.HeaderCell>
              </Table.Header>
              <Table.Body>
                {evaluation.evalResults.map((result) => (
                  <Table.Row key={result.id}>
                    <Table.Cell align="top">
                      <div className="max-w-md space-y-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {result.spec.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {result.spec.id}
                        </p>
                        {result.workflow?.metrics?.totalPrice && (
                          <p className="text-xs text-gray-500">
                            Cost: $
                            {result.workflow.metrics.totalPrice.toFixed(2)}
                          </p>
                        )}
                        {result.workflow?.metrics?.llmRunCount && (
                          <p className="text-xs text-gray-500">
                            LLM runs: {result.workflow.metrics.llmRunCount}
                          </p>
                        )}
                        {result.workflow && (
                          <div className="pt-2">
                            <StyledLink
                              href={`/ai/${result.workflow.id}`}
                              target="_blank"
                              className="text-xs"
                            >
                              View full AI workflow
                            </StyledLink>
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <RunSquiggle code={result.code} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
