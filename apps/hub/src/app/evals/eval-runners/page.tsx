import { format } from "date-fns";
import React from "react";

import { Table } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { StyledLink } from "@/components/ui/StyledLink";
import { getAllEvalRunners } from "@/evals/data/evalRunners";
import { evalRunnerRoute } from "@/lib/routes";

export const metadata = {
  title: "Eval Runners - Squiggle Hub",
};

export default async function EvalRunnersPage() {
  const runners = await getAllEvalRunners();

  return (
    <div>
      {runners.length === 0 ? (
        <Card theme="big">
          <div className="text-center text-gray-500">
            {`No eval runners found. Use the "Create Eval Runner" button to add one.`}
          </div>
        </Card>
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
            {runners.map((runner) => (
              <Table.Row key={runner.id}>
                <Table.Cell>
                  <StyledLink
                    href={evalRunnerRoute({ id: runner.id })}
                    className="text-sm font-medium"
                  >
                    {runner.name}
                  </StyledLink>
                </Table.Cell>
                <Table.Cell theme="text">{runner.id}</Table.Cell>
                <Table.Cell theme="text">{runner.type}</Table.Cell>
                <Table.Cell theme="text">
                  {format(new Date(runner.createdAt), "MMM d, yyyy h:mm a")}
                </Table.Cell>
                <Table.Cell theme="text">
                  {runner._count.evaluations}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
