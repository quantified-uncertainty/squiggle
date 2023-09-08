import { prisma } from "@/prisma";
import { builder } from "../builder";
import { GroupInvite } from "../types/GroupInvite";
import { decodeGlobalID } from "@pothos/plugin-relay";

builder.mutationField("cancelGroupInvite", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("CancelGroupInviteResult", {
      fields: (t) => ({
        invite: t.field({ type: GroupInvite }),
      }),
    }),
    errors: {},
    input: {
      inviteId: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const { typename, id: decodedInviteId } = decodeGlobalID(input.inviteId);
      if (!["UserGroupInvite", "EmailGroupInvite"].includes(typename)) {
        throw new Error("Expected GroupInvite id");
      }

      const invite = await prisma.groupInvite.update({
        where: {
          id: decodedInviteId,
          group: {
            // permissions check
            memberships: {
              some: {
                user: { email: session.user.email },
                role: "Admin",
              },
            },
          },
        },
        data: {
          status: "Canceled",
        },
      });

      return { invite };
    },
  })
);
