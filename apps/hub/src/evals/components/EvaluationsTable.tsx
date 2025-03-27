"use client";

import { format } from "date-fns";
import React from "react";

import { Table } from "@quri/ui";

import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { StyledLink } from "@/components/ui/StyledLink";
import {
  epistemicAgentRoute,
  evaluationRoute,
  questionSetRoute,
} from "@/lib/routes";

import { type EvaluationSummaryDTO } from "../data/summaryEvals";
import { EvaluationStateDisplay } from "./EvaluationStateDisplay";

interface EvaluationsTableProps {
  evaluations: EvaluationSummaryDTO[];
  showQuestionSet?: boolean;
  emptyMessage?: string;
}

export function EvaluationsTable({
  evaluations,
  showQuestionSet = true,
  emptyMessage = "No evaluations found.",
}: EvaluationsTableProps) {
  if (evaluations.length === 0) {
    return <NoEntitiesCard>{emptyMessage}</NoEntitiesCard>;
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
        <Table.HeaderCell>Epistemic Agent</Table.HeaderCell>
        {showQuestionSet && <Table.HeaderCell>Question Set</Table.HeaderCell>}
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
                href={epistemicAgentRoute({ id: evaluation.agent.id })}
                className="text-sm"
              >
                {evaluation.agent.name}
              </StyledLink>
            </Table.Cell>
            {showQuestionSet && evaluation.questionSet && (
              <Table.Cell>
                <StyledLink
                  href={questionSetRoute({ id: evaluation.questionSet.id })}
                  className="text-sm"
                >
                  {evaluation.questionSet.name}
                </StyledLink>
              </Table.Cell>
            )}
            <Table.Cell theme="text">
              {evaluation._count.values} /{" "}
              {evaluation.questionSet.questionCount}
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
