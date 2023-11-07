import { type User as PrismaUser } from "@prisma/client";
import { Session } from "next-auth";

import { prisma } from "@/prisma";
import { SignedInSession, builder } from "../builder";
import { GroupConnection, groupFromMembershipConnectionHelpers } from "./Group";
import {
  ModelConnection,
  modelConnectionHelpers,
  modelWhereHasAccess,
} from "./Model";
import { Owner } from "./Owner";
import {
  RelativeValuesDefinitionConnection,
  relativeValuesDefinitionConnectionHelpers,
} from "./RelativeValuesDefinition";

export function isSignedIn(
  session: Session | null
): session is SignedInSession {
  return Boolean(session?.user.email);
}

export async function getSelf(session: SignedInSession) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });
  return user;
}

export async function isRootUser(user: PrismaUser) {
  // see also: `isRootUser` auth scope in builder.ts
  return Boolean(
    user.email && user.emailVerified && ROOT_EMAILS.includes(user.email)
  );
}

const ROOT_EMAILS = (process.env.ROOT_EMAILS ?? "").split(",");

export const User = builder.prismaNode("User", {
  id: { field: "id" },
  interfaces: [Owner],
  fields: (t) => ({
    slug: t.string({
      select: { asOwner: true },
      resolve(user) {
        if (!user.asOwner) {
          throw new Error("User has no username");
        }
        return user.asOwner.slug;
      },
    }),
    // legacy, alias for user.slug
    username: t.string({
      select: { asOwner: true },
      resolve(user) {
        if (!user.asOwner) {
          throw new Error("User has no username");
        }
        return user.asOwner.slug;
      },
    }),
    // models are stored on owner.models, wo we have to use indirect relation (https://pothos-graphql.dev/docs/plugins/prisma#indirect-relations-as-connections)
    // See also: Group.models field.
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
    relativeValuesDefinitions: t.connection(
      {
        type: relativeValuesDefinitionConnectionHelpers.ref,
        select: (args, ctx, nestedSelection) => ({
          asOwner: {
            select: {
              relativeValuesDefinitions: {
                ...relativeValuesDefinitionConnectionHelpers.getQuery(
                  args,
                  ctx,
                  nestedSelection
                ),
                orderBy: { updatedAt: "desc" },
              },
            },
          },
        }),
        resolve: (user, args, ctx) =>
          relativeValuesDefinitionConnectionHelpers.resolve(
            user.asOwner.relativeValuesDefinitions,
            args,
            ctx
          ),
      },
      RelativeValuesDefinitionConnection
    ),
    groups: t.connection(
      {
        type: groupFromMembershipConnectionHelpers.ref,

        select: (args, ctx, nestedSelection) => ({
          memberships: groupFromMembershipConnectionHelpers.getQuery(
            args,
            ctx,
            nestedSelection
          ),
        }),
        resolve: (user, args, ctx) =>
          groupFromMembershipConnectionHelpers.resolve(
            user.memberships,
            args,
            ctx
          ),
      },
      GroupConnection
    ),
    isRoot: t.boolean({
      authScopes: async (user, _, { session }) => {
        return !!(
          user.emailVerified &&
          user.email &&
          user.email === session?.user.email
        );
      },
      resolve: async (user) => isRootUser(user),
    }),
  }),
});
