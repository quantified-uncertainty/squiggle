import { MembershipRole } from "@prisma/client";

import { prisma } from "@/prisma";
import { builder } from "../builder";
import { GroupInviteConnection } from "./GroupInvite";
import { Session } from "next-auth";

export const MembershipRoleType = builder.enumType(MembershipRole, {
  name: "MembershipRole",
});

export const UserGroupMembership = builder.prismaNode("UserGroupMembership", {
  id: { field: "id" },
  fields: (t) => ({
    role: t.field({
      type: MembershipRoleType,
      resolve: (t) => t.role,
    }),
    user: t.relation("user"),
  }),
});

export const UserGroupMembershipConnection = builder.connectionObject({
  type: UserGroupMembership,
  name: "UserGroupMembershipConnection",
});

async function getMyMembership(groupId: string, session: Session | null) {
  const email = session?.user?.email;
  if (!email) {
    return null;
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  const myMembership = await prisma.userGroupMembership.findUnique({
    where: {
      userId_groupId: {
        groupId: groupId,
        userId: user.id,
      },
    },
  });
  return myMembership;
}

export const Group = builder.prismaNode("Group", {
  id: { field: "id" },
  include: {},
  fields: (t) => ({
    slug: t.exposeString("slug"),
    createdAtTimestamp: t.float({
      resolve: (group) => group.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (group) => group.updatedAt.getTime(),
    }),
    myMembership: t.field({
      type: UserGroupMembership,
      nullable: true,
      resolve: async (root, _, { session }) => {
        return getMyMembership(root.id, session);
      },
    }),
    // Note: I also tried `members` field with membership data exposed on the connection edges, but had issues with it:
    // 1. Edge ids were not Relay ids
    // 2. I couldn't make Pothos accept an interface for edge type, which caused duplication in GraphQL types.
    // Maybe Pothos will improve the support for it in the future: https://pothos-graphql.dev/docs/plugins/prisma#indirect-relations-as-connections
    memberships: t.relatedConnection(
      "memberships",
      { cursor: "id" },
      UserGroupMembershipConnection
    ),
    invites: t.relatedConnection(
      "invites",
      {
        cursor: "id",
        nullable: true, // "null" means "forbidden"
        authScopes: async (group, _, { session }) => {
          // It would be nice to select membership at top level of Group object,
          // since this is also useful for `myMembership` field.
          // But unfortunately Prisma doesn't have select aliases:
          // https://github.com/prisma/prisma/discussions/14316
          // https://github.com/prisma/prisma/issues/8151
          const myMembership = await getMyMembership(group.id, session);
          return myMembership?.role === "Admin";
        },
        unauthorizedResolver: () => null,
        query: () => ({
          orderBy: {
            createdAt: "desc",
          },
          where: {
            status: "Pending",
          },
        }),
      },
      GroupInviteConnection
    ),
  }),
});

export const GroupConnection = builder.connectionObject({
  type: Group,
  name: "GroupConnection",
});
