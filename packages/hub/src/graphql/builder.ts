import SchemaBuilder from "@pothos/core";
import ErrorsPlugin from "@pothos/plugin-errors";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import RelayPlugin from "@pothos/plugin-relay";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ValidationPlugin from "@pothos/plugin-validation";
import WithInputPlugin from "@pothos/plugin-with-input";
import { Session } from "next-auth";
import { NextRequest } from "next/server";

import { prisma } from "@/prisma";

import {
  getMyMembershipById,
  getMyMembershipBySlug,
} from "./helpers/groupHelpers";
import { isRootEmail } from "./helpers/userHelpers";

type Context = {
  session: Session | null;
  request: NextRequest;
};

export type SignedInSession = Session & {
  user: NonNullable<Session["user"]> & { email: string };
};

export type HubSchemaTypes = {
  PrismaTypes: PrismaTypes;
  DefaultEdgesNullability: false;
  Context: Context;
  AuthScopes: {
    signedIn: boolean;
    isRootUser: boolean;
    isGroupAdmin: string;
    isGroupAdminBySlug: string;
    controlsOwnerId: string;
  };
  AuthContexts: {
    // https://pothos-graphql.dev/docs/plugins/scope-auth#change-context-types-based-on-scopes
    signedIn: Context & {
      session: SignedInSession;
    };
    isRootUser: Context & {
      session: SignedInSession;
    };
  };
};

export const builder = new SchemaBuilder<HubSchemaTypes>({
  plugins: [
    // this plugin comes before auth plugin; see also: https://github.com/hayes/pothos/issues/464
    ErrorsPlugin, // https://pothos-graphql.dev/docs/plugins/errors
    ScopeAuthPlugin, // https://pothos-graphql.dev/docs/plugins/scope-auth
    SimpleObjectsPlugin, // https://pothos-graphql.dev/docs/plugins/simple-objects
    WithInputPlugin, // https://pothos-graphql.dev/docs/plugins/with-input
    PrismaPlugin, // https://pothos-graphql.dev/docs/plugins/prisma
    RelayPlugin, // https://pothos-graphql.dev/docs/plugins/relay
    ValidationPlugin, // https://pothos-graphql.dev/docs/plugins/validation
  ],
  prisma: {
    client: prisma,
  },
  relayOptions: {
    clientMutationId: "omit",
    cursorType: "String",
    edgesFieldOptions: {
      nullable: false,
    },
  },
  scopeAuthOptions: {
    defaultStrategy: "all",
  },
  authScopes: async (context) => ({
    signedIn: !!context.session?.user,
    isRootUser: () => {
      const email = context.session?.user.email;
      // Note: there's no emailVerified field in session, is this a problem? Probably not.
      // See also: `isRootUser` function in `types/User.ts`.
      return !!(email && isRootEmail(email));
    },
    isGroupAdmin: async (groupId) => {
      const myMembership = await getMyMembershipById(groupId, context.session);
      return myMembership?.role === "Admin";
    },
    isGroupAdminBySlug: async (groupSlug) => {
      const myMembership = await getMyMembershipBySlug(
        groupSlug,
        context.session
      );
      return myMembership?.role === "Admin";
    },
    controlsOwnerId: async (ownerId) => {
      if (!context.session) {
        return false;
      }
      return Boolean(
        await prisma.owner.count({
          where: {
            id: ownerId,
            OR: [
              {
                user: { email: context.session.user.email },
              },
              {
                group: {
                  memberships: {
                    some: {
                      user: {
                        email: context.session.user.email,
                      },
                    },
                  },
                },
              },
            ],
          },
        })
      );
    },
  }),
  errorOptions: {
    defaultTypes: [Error],
    directResult: true,
  },
});

builder.queryType({});
builder.mutationType({});
