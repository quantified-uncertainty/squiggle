"use client";
import { FC, ReactNode } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu, DropdownMenuActionItem, GroupIcon } from "@quri/ui";

import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";
import { H1, H2 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { GroupMemberList } from "./GroupMemberList";
import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { DotsDropdown } from "@/components/ui/DotsDropdown";

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
        myMembership {
          id
          role
        }
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

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
      <section>
        <div className="flex justify-between">
          <H2>Members</H2>
          {group.myMembership?.role === "Admin" ? (
            <DotsDropdown>
              {() => (
                <DropdownMenu>
                  <DropdownMenuActionItem
                    title="Add member"
                    onClick={function (): void {
                      throw new Error("Function not implemented.");
                    }}
                  />
                </DropdownMenu>
              )}
            </DotsDropdown>
          ) : null}
        </div>
        <GroupMemberList groupRef={group} />
      </section>
    </div>
  );
};
