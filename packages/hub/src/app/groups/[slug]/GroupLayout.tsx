"use client";
import { GroupIcon } from "@quri/ui";

import { GroupLayoutQuery } from "@/__generated__/GroupLayoutQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { groupMembersRoute, groupRoute } from "@/routes";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";
import { InviteForMe } from "./InviteForMe";
import { useSubscribeToInvalidationState } from "react-relay";

const Query = graphql`
  query GroupLayoutQuery($slug: String!) {
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
        ...hooks_useIsGroupAdmin
        ...InviteForMe
      }
    }
  }
`;

export const GroupLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<GroupLayoutQuery>;
  }>
> = ({ query, children }) => {
  const [{ result }, { reload }] = usePageQuery(Query, query);
  const group = extractFromGraphqlErrorUnion(result, "Group");

  useSubscribeToInvalidationState([group.id], reload);

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
      <InviteForMe groupRef={group} />
      <StyledTabLink.List>
        <StyledTabLink name="Models" href={groupRoute({ slug: group.slug })} />
        <StyledTabLink
          name="Members"
          href={groupMembersRoute({ slug: group.slug })}
        />
      </StyledTabLink.List>
      <div>{children}</div>
    </div>
  );
};
