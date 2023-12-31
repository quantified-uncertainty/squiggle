import { ZodError } from "zod";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";
import { getWriteableModel } from "../helpers/modelHelpers";
import { validateSlug } from "../utils";

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
