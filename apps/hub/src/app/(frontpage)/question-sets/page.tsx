import React from "react";

import { Table } from "@quri/ui";

import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { StyledLink } from "@/components/ui/StyledLink";
import { QuestionSetActionsButton } from "@/evals/components/QuestionSetActionsButton";
import { getAllQuestionSets } from "@/evals/data/questionSets";
import { questionSetRoute } from "@/lib/routes";

export const metadata = {
  title: "Question Sets - Squiggle Hub",
};

export default async function QuestionSetsPage() {
  const questionSets = await getAllQuestionSets();

  return (
    <div>
      {questionSets.length === 0 ? (
        <NoEntitiesCard>No question sets found.</NoEntitiesCard>
      ) : (
        <Table>
          <Table.Header>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Questions Count</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {questionSets.map((questionSet) => (
              <Table.Row key={questionSet.id}>
                <Table.Cell>
                  <StyledLink
                    href={questionSetRoute({ id: questionSet.id })}
                    className="text-sm font-medium"
                  >
                    {questionSet.name}
                  </StyledLink>
                </Table.Cell>
                <Table.Cell theme="text">{questionSet.id}</Table.Cell>
                <Table.Cell theme="text">
                  {questionSet.questions.length}
                </Table.Cell>
                <Table.Cell>
                  <QuestionSetActionsButton
                    questionSetId={questionSet.id}
                    questionSetName={questionSet.name}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
