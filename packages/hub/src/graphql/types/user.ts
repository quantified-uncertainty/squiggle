import { builder } from "../builder";
import { ModelConnection } from "./models";

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
    models: t.relatedConnection("models", { cursor: "id" }, ModelConnection),
  }),
});
