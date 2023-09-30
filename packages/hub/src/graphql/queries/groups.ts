import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Group, GroupConnection } from "../types/Group";
import { isSignedIn } from "../types/User";

const GroupsQueryInput = builder.inputType("GroupsQueryInput", {
  fields: (t) => ({
    slugContains: t.string(),
    myOnly: t.boolean({
      description: "List only groups that you're a member of",
    }),
  }),
});

builder.queryField("groups", (t) =>
  t.prismaConnection(
    {
      type: Group,
      cursor: "id",
      args: {
        input: t.arg({ type: GroupsQueryInput }),
      },
      resolve: async (query, _, { input }, { session }) => {
        if (input?.myOnly && !isSignedIn(session)) {
          // Relay stuggles with union types on connection fields (see e.g. https://github.com/facebook/relay/issues/4366)
          // So we return an empty list instead of throwing an error.
          return [];
        }

        return await prisma.group.findMany({
          ...query,
          orderBy: {
            updatedAt: "desc",
          },
          where: {
            ...(input?.slugContains && {
              asOwner: {
                slug: {
                  contains: input.slugContains,
                },
              },
            }),
            ...(input?.myOnly &&
              isSignedIn(session) && {
                memberships: {
                  some: {
                    user: { email: session.user.email },
                  },
                },
              }),
          },
        });
      },
    },
    GroupConnection
  )
);
