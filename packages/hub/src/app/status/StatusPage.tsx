"use client";

import { FC } from "react";
import { graphql } from "relay-runtime";

import { H1 } from "@/components/ui/Headers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { StatusPageQuery } from "@/__generated__/StatusPageQuery.graphql";

const Query = graphql`
  query StatusPageQuery {
    globalStatistics {
      users
      models
      relativeValuesDefinitions
    }
  }
`;

const StatRow: FC<{ name: string; value: number }> = ({ name, value }) => (
  <tr className="border">
    <td className="p-4 font-bold">{name}</td>
    <td className="p-4">{value}</td>
  </tr>
);

export const StatusPage: FC<{
  query: SerializablePreloadedQuery<StatusPageQuery>;
}> = ({ query }) => {
  const [{ globalStatistics: stats }] = usePageQuery(Query, query);

  return (
    <div>
      <H1>Global statistics</H1>
      <table className="mt-8 table-auto bg-white">
        <tbody>
          <StatRow name="Users" value={stats.users} />
          <StatRow name="Models" value={stats.models} />
          <StatRow
            name="Relative Values Definitions"
            value={stats.relativeValuesDefinitions}
          />
        </tbody>
      </table>
    </div>
  );
};
