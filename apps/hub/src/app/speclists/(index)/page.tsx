import React from "react";

import { Table } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { StyledLink } from "@/components/ui/StyledLink";
import { SpecListActionsButton } from "@/evals/components/SpecListActionsButton";
import { getAllSpecLists } from "@/evals/data/specLists";
import { speclistRoute } from "@/lib/routes";

export const metadata = {
  title: "Spec Lists - Squiggle Hub",
};

export default async function SpecListsPage() {
  const specLists = await getAllSpecLists();

  return (
    <div>
      {specLists.length === 0 ? (
        <Card theme="big">
          <div className="text-center text-gray-500">
            No spec lists found. Create one by running the add-speclist.ts
            script.
          </div>
        </Card>
      ) : (
        <Table>
          <Table.Header>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Specs Count</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {specLists.map((specList) => (
              <Table.Row key={specList.id}>
                <Table.Cell>
                  <StyledLink
                    href={speclistRoute({ id: specList.id })}
                    className="text-sm font-medium"
                  >
                    {specList.name}
                  </StyledLink>
                </Table.Cell>
                <Table.Cell theme="text">{specList.id}</Table.Cell>
                <Table.Cell theme="text">{specList.specs.length}</Table.Cell>
                <Table.Cell>
                  <SpecListActionsButton
                    specListId={specList.id}
                    specListName={specList.name}
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
