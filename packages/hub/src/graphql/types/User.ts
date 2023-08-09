import { builder } from "../builder";
import { ModelConnection, modelWhereHasAccess } from "./Model";
import { RelativeValuesDefinitionConnection } from "./RelativeValuesDefinition";

export const User = builder.prismaNode("User", {
  id: { field: "id" },
  fields: (t) => ({
    username: t.string({
      resolve(user) {
        if (!user.username) {
          throw new Error("User has no username");
        }
        return user.username;
      },
    }),
    models: t.relatedConnection(
      "models",
      {
        cursor: "id",
        query: (_, { session }) => ({
          orderBy: { updatedAt: "desc" },
          where: modelWhereHasAccess(session),
        }),
      },
      ModelConnection
    ),
    relativeValuesDefinitions: t.relatedConnection(
      "relativeValuesDefinitions",
      { cursor: "id" },
      RelativeValuesDefinitionConnection
    ),
  }),
});
