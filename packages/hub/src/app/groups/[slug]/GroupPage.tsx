"use client";
import { FC } from "react";
import { useSubscribeToInvalidationState } from "react-relay";
import { graphql } from "relay-runtime";

import { GroupIcon, StyledTab } from "@quri/ui";

import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { GroupInviteList } from "./GroupInviteList";
import { GroupMemberList } from "./GroupMemberList";
import { InviteForMe } from "./InviteForMe";
import { useIsGroupAdmin } from "./hooks";
import { GroupModelList } from "./GroupModelList";

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
        ...GroupModelList
        ...hooks_useIsGroupAdmin
        ...InviteForMe
      }
    }
  }
`;

export const GroupPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, GroupPageQuery>;
}> = ({ query }) => {
  const [{ result }, { reload }] = usePageQuery(Query, query);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  useSubscribeToInvalidationState([group.id], reload);

  const isAdmin = useIsGroupAdmin(group);

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
      <InviteForMe groupRef={group} />
      <StyledTab.Group>
        <StyledTab.List>
          <StyledTab name="Models" />
          <StyledTab name="Members" />
        </StyledTab.List>
        <div className="mt-4">
          <StyledTab.Panels>
            <StyledTab.Panel>
              <GroupModelList groupRef={group} />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <div className="space-y-8">
                <section>
                  <GroupMemberList groupRef={group} />
                </section>
                {isAdmin && (
                  <section>
                    <GroupInviteList groupRef={group} />
                  </section>
                )}
              </div>
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </div>
  );
};
