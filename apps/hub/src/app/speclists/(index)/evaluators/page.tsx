import { format } from "date-fns";
import React from "react";

import { Table } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { getAllEvaluators } from "@/evals/data/evaluators";
import { evaluatorRoute } from "@/lib/routes";

export const metadata = {
  title: "Evaluators - Squiggle Hub",
};

export default async function EvaluatorsPage() {
  const evaluators = await getAllEvaluators();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Evaluators</H2>
      </div>

      <div className="rounded-lg bg-white shadow-md">
        {evaluators.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {`No evaluators found. Use the "Create Evaluator" button to add one.`}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
              <Table.HeaderCell>Evals Count</Table.HeaderCell>
            </Table.Header>
            <Table.Body>
              {evaluators.map((evaluator) => (
                <Table.Row key={evaluator.id}>
                  <Table.Cell>
                    <StyledLink
                      href={evaluatorRoute({ id: evaluator.id })}
                      className="text-sm font-medium"
                    >
                      {evaluator.name}
                    </StyledLink>
                  </Table.Cell>
                  <Table.Cell theme="text">{evaluator.id}</Table.Cell>
                  <Table.Cell theme="text">{evaluator.type}</Table.Cell>
                  <Table.Cell theme="text">
                    {format(
                      new Date(evaluator.createdAt),
                      "MMM d, yyyy h:mm a"
                    )}
                  </Table.Cell>
                  <Table.Cell theme="text">{evaluator._count.Eval}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  );
}
