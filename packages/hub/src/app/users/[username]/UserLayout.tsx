"use client";
import { UserIcon } from "@quri/ui";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { UserLayoutQuery } from "@/__generated__/UserLayoutQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { userDefinitionsRoute, userGroupsRoute, userRoute } from "@/routes";

const Query = graphql`
  query UserLayoutQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on User {
        username
      }
    }
  }
`;

export const UserLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<UserLayoutQuery>;
  }>
> = ({ query, children }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <UserIcon className="opacity-50 mr-2" />
          {user.username}
        </div>
      </H1>
      <StyledTabLink.List>
        <StyledTabLink
          name="Models"
          href={userRoute({ username: user.username })}
        />
        <StyledTabLink
          name="Definitions"
          href={userDefinitionsRoute({ username: user.username })}
        />
        <StyledTabLink
          name="Groups"
          href={userGroupsRoute({ username: user.username })}
        />
      </StyledTabLink.List>
      <div>{children}</div>
    </div>
  );
};
