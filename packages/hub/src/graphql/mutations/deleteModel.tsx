import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { getWriteableModel } from "../types/Model";
import { validateSlug } from "../utils";
import { ZodError } from "zod";
import { NotFoundError } from "../errors/NotFoundError";

builder.mutationField("deleteModel", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("DeleteModelResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    input: {
      owner: t.input.string({ required: true, validate: validateSlug }),
      slug: t.input.string({ required: true, validate: validateSlug }),
    },
    errors: { types: [ZodError, NotFoundError] },
    async resolve(_, { input }, { session }) {
      const model = await getWriteableModel({
        slug: input.slug,
        owner: input.owner,
        session,
      });

      await prisma.model.delete({
        where: { id: model.id },
      });

      return { ok: true };
    },
  })
);
