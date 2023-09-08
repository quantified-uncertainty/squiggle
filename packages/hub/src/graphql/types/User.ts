import { builder } from "../builder";
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
              relativeValuesDefinitions:
                relativeValuesDefinitionConnectionHelpers.getQuery(
                  args,
                  ctx,
                  nestedSelection
                ),
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
  }),
});
