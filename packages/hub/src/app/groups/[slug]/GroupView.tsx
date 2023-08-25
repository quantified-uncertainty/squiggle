"use client";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { H1 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import QueryNode, {
  GroupViewQuery,
} from "@/__generated__/GroupViewQuery.graphql";
import { GroupIcon } from "@quri/ui";

const Query = graphql`
  query GroupViewQuery($slug: String!) {
    result: group(slug: $slug) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Group {
        id
        slug
      }
    }
  }
`;

export const GroupView: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, GroupViewQuery>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { result } = usePreloadedQuery(Query, queryRef);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  return (
    <div>
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
    </div>
  );
};
