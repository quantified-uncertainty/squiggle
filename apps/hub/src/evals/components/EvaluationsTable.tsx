"use client";

import { format } from "date-fns";
import React from "react";

import { Table } from "@quri/ui";

import { StyledLink } from "@/components/ui/StyledLink";
import { evalRunnerRoute, evaluationRoute, speclistRoute } from "@/lib/routes";

import { type EvaluationSummaryDTO } from "../data/summaryEvals";
import { EvaluationStateDisplay } from "./EvaluationStateDisplay";

interface EvaluationsTableProps {
  evaluations: EvaluationSummaryDTO[];
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
    <Table>
      <Table.Header>
        <Table.HeaderCell>ID</Table.HeaderCell>
        <Table.HeaderCell>Created</Table.HeaderCell>
        <Table.HeaderCell>State</Table.HeaderCell>
        <Table.HeaderCell>Eval Runner</Table.HeaderCell>
        {showSpecList && <Table.HeaderCell>Spec List</Table.HeaderCell>}
        <Table.HeaderCell>Results Count</Table.HeaderCell>
        <Table.HeaderCell>Total Cost</Table.HeaderCell>
        <Table.HeaderCell>LLM Runs</Table.HeaderCell>
        <Table.HeaderCell>Actions</Table.HeaderCell>
      </Table.Header>
      <Table.Body>
        {evaluations.map((evaluation) => (
          <Table.Row key={evaluation.id}>
            <Table.Cell>
              <StyledLink
                href={evaluationRoute({ id: evaluation.id })}
                className="text-sm"
              >
                {evaluation.id}
              </StyledLink>
            </Table.Cell>
            <Table.Cell theme="text">
              {format(new Date(evaluation.createdAt), "MMM d, yyyy h:mm a")}
            </Table.Cell>
            <Table.Cell>
              <EvaluationStateDisplay
                state={evaluation.state}
                errorMsg={evaluation.errorMsg}
              />
            </Table.Cell>
            <Table.Cell>
              <StyledLink
                href={evalRunnerRoute({ id: evaluation.runner.id })}
                className="text-sm"
              >
                {evaluation.runner.name}
              </StyledLink>
            </Table.Cell>
            {showSpecList && evaluation.specList && (
              <Table.Cell>
                <StyledLink
                  href={speclistRoute({ id: evaluation.specList.id })}
                  className="text-sm"
                >
                  {evaluation.specList.name}
                </StyledLink>
              </Table.Cell>
            )}
            <Table.Cell theme="text">
              {evaluation._count.results} / {evaluation.specList.specCount}
            </Table.Cell>
            <Table.Cell theme="text">
              {formatCost(evaluation.metrics?.totalPrice)}
            </Table.Cell>
            <Table.Cell theme="text">
              {formatRunCount(evaluation.metrics?.llmRunCount)}
            </Table.Cell>
            <Table.Cell theme="text">(none)</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
