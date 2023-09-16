import { ZodError } from "zod";

import { prisma } from "@/prisma";
import { builder } from "../builder";
import { Model, getWriteableModel } from "../types/Model";
import { getWriteableOwnerBySlug } from "../types/Owner";
import { validateSlug } from "../utils";
import { NotFoundError } from "../errors/NotFoundError";

builder.mutationField("moveModel", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("MoveModelResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: { types: [NotFoundError, ZodError] },
    input: {
      oldOwner: t.input.string({ required: true, validate: validateSlug }),
      newOwner: t.input.string({ required: true, validate: validateSlug }),
      slug: t.input.string({ required: true, validate: validateSlug }),
    },
    resolve: async (_, { input }, { session }) => {
      let model = await getWriteableModel({
        owner: input.oldOwner,
        slug: input.slug,
        session,
      });

      const newOwner = await getWriteableOwnerBySlug(session, input.newOwner);

      model = await prisma.model.update({
        where: { id: model.id },
        data: { ownerId: newOwner.id },
      });

      return { model };
    },
  })
);
