import { MembershipRole } from "@prisma/client";

import { prisma } from "@/prisma";
import { builder } from "../builder";

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

// export const UserGroupInvite = builder.prismaNode("UserGroupInvite", {
//   id: { field: "id" },
//   fields: (t) => ({
//     user: t.relation("user"),
//     group: t.relation("group"),
//     role: t.field({
//       type: MembershipRoleType,
//       resolve: (t) => t.role,
//     }),
//   }),
// });

export const Group = builder.prismaNode("Group", {
  id: { field: "id" },
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
        const email = session?.user?.email;
        if (!email) {
          return null;
        }
        const user = await prisma.user.findUniqueOrThrow({
          where: { email },
        });
        const membership = await prisma.userGroupMembership.findUnique({
          where: {
            userId_groupId: {
              groupId: root.id,
              userId: user.id,
            },
          },
        });
        if (!membership) {
          return null;
        }
        return membership;
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
  }),
});

export const GroupConnection = builder.connectionObject({
  type: Group,
  name: "GroupConnection",
});
