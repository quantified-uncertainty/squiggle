import crypto from "crypto";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Group } from "../types/Group";

builder.mutationField("createReusableGroupInviteToken", (t) =>
  t.fieldWithInput({
    description: `Create or replace a reusable invite token for a group, available as \`reusableInviteToken\` field on group object.

You must be an admin of the group to call this mutation. Previous invite token, if it existed, will stop working.`,
    type: builder.simpleObject("CreateReusableGroupInviteTokenResult", {
      fields: (t) => ({
        group: t.field({ type: Group }),
      }),
    }),
    errors: {},
    authScopes: (_, { input }) => ({
      isGroupAdminBySlug: input.slug,
    }),
    input: {
      slug: t.input.string({ required: true }),
    },
    resolve: async (_, { input }) => {
      let group = await prisma.group.findFirstOrThrow({
        where: {
          asOwner: {
            slug: input.slug,
          },
        },
      });

      const token = crypto.randomBytes(30).toString("hex");

      group = await prisma.group.update({
        where: {
          id: group.id,
        },
        data: {
          // old token will be overwritten, that's fine
          reusableInviteToken: token,
        },
      });

      return { group };
    },
  })
);
