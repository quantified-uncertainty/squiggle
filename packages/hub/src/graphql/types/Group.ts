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
import { getSelf, isSignedIn } from "./User";
import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

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
    // TODO - group relation
  }),
});

export const UserGroupMembershipConnection = builder.connectionObject({
  type: UserGroupMembership,
  name: "UserGroupMembershipConnection",
});

export async function getMembership({
  groupSlug,
  userSlug,
}: {
  groupSlug: string;
  userSlug: string;
}) {
  const membership = await prisma.userGroupMembership.findFirst({
    where: {
      user: {
        asOwner: {
          slug: userSlug,
        },
      },
      group: {
        asOwner: {
          slug: groupSlug,
        },
      },
    },
  });
  return membership;
}

export async function getMyMembership({
  groupSlug,
  session,
}: {
  groupSlug: string;
  session: Session | null;
}) {
  if (!isSignedIn(session)) {
    return null;
  }
  const self = await getSelf(session);
  const myMembership = await prisma.userGroupMembership.findFirst({
    where: {
      userId: self.id,
      group: {
        asOwner: {
          slug: groupSlug,
        },
      },
    },
  });
  return myMembership;
}

async function getMyMembershipById(groupId: string, session: Session | null) {
  if (!isSignedIn(session)) {
    return null;
  }
  const self = await getSelf(session);
  const myMembership = await prisma.userGroupMembership.findUnique({
    where: {
      userId_groupId: {
        groupId: groupId,
        userId: self.id,
      },
    },
  });
  return myMembership;
}

// also returns true if user is not an admin
export async function groupHasAdminsBesidesUser({
  groupSlug,
  userSlug,
}: {
  groupSlug: string;
  userSlug: string;
}) {
  return Boolean(
    await prisma.userGroupMembership.count({
      where: {
        group: {
          asOwner: {
            slug: groupSlug,
          },
        },
        NOT: {
          user: {
            asOwner: {
              slug: userSlug,
            },
          },
        },
        role: "Admin",
      },
    })
  );
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
        return getMyMembershipById(root.id, session);
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
          const myMembership = await getMyMembershipById(group.id, session);
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
                orderBy: { updatedAt: "desc" },
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

export const GroupConnection = builder.connectionObject({
  type: Group,
  name: "GroupConnection",
});

// useful when we want to expose `groups` field on a `User`, instead of `memberships`
export const groupFromMembershipConnectionHelpers = prismaConnectionHelpers(
  builder,
  "UserGroupMembership",
  {
    cursor: "id",
    select: (nodeSelection) => ({
      group: nodeSelection(),
    }),
    resolveNode: (node) => node.group,
  }
);
