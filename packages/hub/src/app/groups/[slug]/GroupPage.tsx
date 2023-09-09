"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { GroupPageQuery } from "@/__generated__/GroupPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { GroupModelList } from "./GroupModelList";

const Query = graphql`
  query GroupPageQuery($slug: String!) {
    result: group(slug: $slug) {
      __typename
      ... on Group {
        id
        slug
        ...GroupModelList
      }
    }
  }
`;

export const GroupPage: FC<{
  query: SerializablePreloadedQuery<GroupPageQuery>;
}> = ({ query }) => {
  const [{ result }] = usePageQuery(Query, query);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  return <GroupModelList groupRef={group} />;
};
