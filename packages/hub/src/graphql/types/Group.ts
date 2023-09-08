import { MembershipRole } from "@prisma/client";

import { prisma } from "@/prisma";
import { Session } from "next-auth";
import { builder } from "../builder";
import { GroupInvite, GroupInviteConnection } from "./GroupInvite";
import {
  ModelConnection,
  modelConnectionHelpers,
  modelWhereHasAccess,
} from "./Model";
import { Owner } from "./Owner";

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
  interfaces: [Owner],
  fields: (t) => ({
    slug: t.string({
      select: { asOwner: true },
      resolve: (group) => group.asOwner.slug,
    }),
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
        // TODO - `prismaField`?
        // TODO - this causes an extra query, optimize somehow?
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
    inviteForMe: t.withAuth({ signedIn: true }).field({
      type: GroupInvite,
      nullable: true,
      unauthorizedResolver: () => null,
      select: (_, { session }) => ({
        invites: {
          where: {
            user: {
              email: session?.user.email,
            },
            status: "Pending",
          },
        },
      }),
      resolve: (group) => group.invites[0],
    }),
    // Models are stored on owner.models, wo we have to use indirect relation (https://pothos-graphql.dev/docs/plugins/prisma#indirect-relations-as-connections)
    // See also: User.models field.
    models: t.connection(
      {
        type: modelConnectionHelpers.ref,
        select: (args, ctx, nestedSelection) => ({
          asOwner: {
            select: {
              models: {
                ...modelConnectionHelpers.getQuery(args, ctx, nestedSelection),
                where: modelWhereHasAccess(ctx.session),
              },
            },
          },
        }),
        resolve: (user, args, ctx) =>
          modelConnectionHelpers.resolve(user.asOwner.models, args, ctx),
      },
      ModelConnection
    ),
  }),
});
