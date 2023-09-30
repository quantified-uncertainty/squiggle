"use client";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { Button, PlusIcon, UserIcon } from "@quri/ui";

import { UserLayoutQuery } from "@/__generated__/UserLayoutQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { useUsername } from "@/hooks/useUsername";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  newDefinitionRoute,
  newGroupRoute,
  newModelRoute,
  userDefinitionsRoute,
  userGroupsRoute,
  userRoute,
} from "@/routes";

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
        # fields for count (empty/non-empty)
        # TODO: implement "totalCount" field instead
        models(first: 1) {
          edges {
            __typename
          }
        }
        relativeValuesDefinitions(first: 1) {
          edges {
            __typename
          }
        }
        groups(first: 1) {
          edges {
            __typename
          }
        }
      }
    }
  }
`;

const NewButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  let link = newModelRoute();
  let text = "New Model";

  if (segment === "groups") {
    link = newGroupRoute();
    text = "New Group";
  } else if (segment === "definitions") {
    link = newDefinitionRoute();
    text = "New Definition";
  }

  const router = useRouter();

  return (
    <Button onClick={() => router.push(link)}>
      <div className="flex gap-1 items-center">
        <PlusIcon size={16} />
        {text}
      </div>
    </Button>
  );
};

export const UserLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<UserLayoutQuery>;
  }>
> = ({ query, children }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  const myUsername = useUsername();
  const isMe = user.username === myUsername;

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <UserIcon className="opacity-50 mr-2" />
          {user.username}
        </div>
      </H1>
      <div className="flex gap-4 items-center">
        <StyledTabLink.List>
          {isMe || user.models.edges.length ? (
            <StyledTabLink
              name="Models"
              href={userRoute({ username: user.username })}
            />
          ) : null}
          {isMe || user.relativeValuesDefinitions.edges.length ? (
            <StyledTabLink
              name="Definitions"
              href={userDefinitionsRoute({ username: user.username })}
            />
          ) : null}
          {isMe || user.groups.edges.length ? (
            <StyledTabLink
              name="Groups"
              href={userGroupsRoute({ username: user.username })}
            />
          ) : null}
        </StyledTabLink.List>
        {isMe && <NewButton />}
      </div>
      <div>{children}</div>
    </div>
  );
};
