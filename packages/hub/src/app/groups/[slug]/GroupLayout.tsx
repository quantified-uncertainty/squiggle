"use client";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useSubscribeToInvalidationState } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, GroupIcon, PlusIcon } from "@quri/ui";

import { H1 } from "@/components/ui/Headers";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { groupMembersRoute, groupRoute, newModelRoute } from "@/routes";

import { useIsGroupMember } from "./hooks";
import { InviteForMe } from "./InviteForMe";

import { GroupLayoutQuery } from "@/__generated__/GroupLayoutQuery.graphql";

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
        ...hooks_useIsGroupMember
        ...InviteForMe
      }
    }
  }
`;

const NewButton: FC<{ group: string }> = ({ group }) => {
  const segment = useSelectedLayoutSegment();

  let link = newModelRoute({ group });

  const router = useRouter();

  if (segment === "members" || segment === "invite-link") {
    return null;
  }

  return (
    <Button onClick={() => router.push(link)}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Model
      </div>
    </Button>
  );
};

export const GroupLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<GroupLayoutQuery>;
  }>
> = ({ query, children }) => {
  const [{ result }, { reload }] = usePageQuery(Query, query);
  const group = extractFromGraphqlErrorUnion(result, "Group");

  useSubscribeToInvalidationState([group.id], reload);

  const isMember = useIsGroupMember(group);

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="mr-2 opacity-50" />
          {group.slug}
        </div>
      </H1>
      <InviteForMe groupRef={group} />
      <div className="flex items-center gap-2">
        <StyledTabLink.List>
          <StyledTabLink
            name="Models"
            href={groupRoute({ slug: group.slug })}
          />
          <StyledTabLink
            name="Members"
            href={groupMembersRoute({ slug: group.slug })}
          />
        </StyledTabLink.List>
        {isMember && <NewButton group={group.slug} />}
      </div>
      <div>{children}</div>
    </div>
  );
};
