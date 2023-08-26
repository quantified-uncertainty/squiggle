import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder } from "../builder";
import { User } from "./User";
import { MembershipRole } from "@prisma/client";

const memberConnectionHelpers = prismaConnectionHelpers(
  builder,
  "UserGroupMembership",
  {
    cursor: "id",
    select: (nodeSelection) => ({
      user: nodeSelection(),
      id: true,
      role: true,
    }),
    resolveNode: (membership) => membership.user,
  }
);

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
    // https://pothos-graphql.dev/docs/plugins/prisma#indirect-relations-as-connections
    members: t.connection(
      {
        type: User,
        select: (args, ctx, nestedSelection) => ({
          memberships: memberConnectionHelpers.getQuery(
            args,
            ctx,
            nestedSelection
          ),
        }),
        resolve: (group, args, ctx) =>
          // This helper takes a list of nodes and formats them for the connection
          memberConnectionHelpers.resolve(group.memberships, args, ctx),
      },
      {},
      {
        fields: (edge) => ({
          id: edge.exposeID("id"),
          role: edge.field({
            type: builder.enumType(MembershipRole, { name: "MembershipRole" }),
            resolve: (edge) => edge.role,
          }),
        }),
      }
    ),
  }),
});

export const GroupConnection = builder.connectionObject({
  type: Group,
  name: "GroupConnection",
});
