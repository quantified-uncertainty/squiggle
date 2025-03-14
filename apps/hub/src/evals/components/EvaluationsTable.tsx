"use client";

import { format } from "date-fns";
import React from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { evaluationRoute, evaluatorRoute, speclistRoute } from "@/lib/routes";

import { type EvalSummaryDTO } from "../data/evals";

interface EvaluationsTableProps {
  evaluations: EvalSummaryDTO[];
  showSpecList?: boolean;
  emptyMessage?: string;
}

export function EvaluationsTable({
  evaluations,
  showSpecList = true,
  emptyMessage = "No evaluations found.",
}: EvaluationsTableProps) {
  if (evaluations.length === 0) {
    return <div className="p-6 text-center text-gray-500">{emptyMessage}</div>;
  }

  // Format cost to display as currency
  const formatCost = (price: number | undefined): string => {
    if (price === undefined) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  // Format LLM run count
  const formatRunCount = (count: number | undefined): string => {
    if (count === undefined) return "N/A";
    return count.toString();
  };

  return (
    <table className="min-w-full">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Created
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Evaluator
          </th>
          {showSpecList && (
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Spec List
            </th>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Results Count
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Total Cost
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            LLM Runs
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {evaluations.map((evaluation) => (
          <tr key={evaluation.id} className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-6 py-4 text-sm">
              <StyledLink href={evaluationRoute({ id: evaluation.id })}>
                {evaluation.id}
              </StyledLink>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {format(new Date(evaluation.createdAt), "MMM d, yyyy h:mm a")}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              <StyledLink
                href={evaluatorRoute({ id: evaluation.evaluator.id })}
              >
                {evaluation.evaluator.name}
              </StyledLink>
            </td>
            {showSpecList && evaluation.specList && (
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <StyledLink
                  href={speclistRoute({ id: evaluation.specList.id })}
                >
                  {evaluation.specList.name}
                </StyledLink>
              </td>
            )}
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {evaluation._count.evalResults}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {formatCost(evaluation.metrics?.totalPrice)}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {formatRunCount(evaluation.metrics?.llmRunCount)}
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              <StyledLink href={evaluationRoute({ id: evaluation.id })}>
                View
              </StyledLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
