import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Table } from "../components/Table/Table.js";

const meta: Meta<typeof Table> = {
  title: "Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Basic: Story = {
  render: () => (
    <Table>
      <Table.Header>
        <Table.HeaderCell>ID</Table.HeaderCell>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell>Created At</Table.HeaderCell>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>1</Table.Cell>
          <Table.Cell>Project Alpha</Table.Cell>
          <Table.Cell theme="text">Active</Table.Cell>
          <Table.Cell theme="text">Mar 14, 2025</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>2</Table.Cell>
          <Table.Cell>Project Beta</Table.Cell>
          <Table.Cell theme="text">Pending</Table.Cell>
          <Table.Cell theme="text">Mar 13, 2025</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>3</Table.Cell>
          <Table.Cell>Project Gamma</Table.Cell>
          <Table.Cell theme="text">Completed</Table.Cell>
          <Table.Cell theme="text">Mar 12, 2025</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
