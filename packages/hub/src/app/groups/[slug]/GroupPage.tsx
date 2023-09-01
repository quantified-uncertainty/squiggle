"use client";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { GroupIcon, StyledTab } from "@quri/ui";

import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { GroupInviteList } from "./GroupInviteList";
import { GroupMemberList } from "./GroupMemberList";
import { useIsGroupAdmin } from "./hooks";

const Query = graphql`
  query GroupPageQuery($slug: String!) {
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
        ...GroupMemberList
        ...GroupInviteList
        ...hooks_useIsGroupAdmin
      }
    }
  }
`;

export const GroupPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, GroupPageQuery>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { result } = usePreloadedQuery(Query, queryRef);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  const isAdmin = useIsGroupAdmin(group);

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
      <StyledTab.Group>
        <StyledTab.List>
          <StyledTab name="Models" />
          <StyledTab name="Members" />
        </StyledTab.List>
        <div className="mt-4">
          <StyledTab.Panels>
            <StyledTab.Panel>TODO</StyledTab.Panel>
            <StyledTab.Panel>
              <section>
                <GroupMemberList groupRef={group} />
              </section>
              {isAdmin && (
                <section>
                  <GroupInviteList groupRef={group} />
                </section>
              )}
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </div>
  );
};
