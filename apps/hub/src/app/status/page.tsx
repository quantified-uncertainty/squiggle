import { Metadata } from "next";
import { FC } from "react";

import { Table } from "@quri/ui";

import { getGlobalStatistics } from "@/lib/server/globalStatistics";

const StatRow: FC<{ name: string; value: number }> = ({ name, value }) => (
  <Table.Row>
    <Table.Cell>
      <div className="font-bold">{name}</div>
    </Table.Cell>
    <Table.Cell>{value}</Table.Cell>
  </Table.Row>
);

export default async function OuterFrontPage() {
  const stats = await getGlobalStatistics();

  return (
    <Table>
      <Table.Header>
        <Table.HeaderCell>Entity Type</Table.HeaderCell>
        <Table.HeaderCell>Count</Table.HeaderCell>
      </Table.Header>
      <Table.Body>
        <StatRow name="Users" value={stats.users} />
        <StatRow name="Models" value={stats.models} />
        <StatRow
          name="Relative Values Definitions"
          value={stats.relativeValuesDefinitions}
        />
      </Table.Body>
    </Table>
  );
}

export const metadata: Metadata = {
  title: "Status",
};

export const dynamic = "force-dynamic";
