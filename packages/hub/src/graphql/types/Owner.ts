import { decodeGlobalID } from "@pothos/plugin-relay";
import { builder } from "../builder";
import { ExtractInputShape } from "../utils";

// common for User and Group
export const Owner = builder.interfaceRef<{ id: string }>("Owner").implement({
  resolveType: (obj) => {
    if ("email" in obj) {
      return "User";
    }
    if ("slug" in obj) {
      return "Group"; // not very safe, we can rename `User.username` to `User.slug` later
    }
    throw new Error(`Unkown object ${obj.id}`);
  },
  fields: (t) => ({
    id: t.exposeID("id"),
    slug: t.string({
      resolve: (obj) => {
        // `slug` is exposed in interface type because it won't be exactly compatible with User/Group prisma shapes.
        // So we have to pick a field name in runtime.
        if ("slug" in obj && typeof obj.slug === "string") {
          return obj.slug;
        }
        if ("username" in obj && typeof obj.username === "string") {
          return obj.username;
        }
        throw new Error(
          "Expected either `slug` or `username` field to be present"
        );
      },
    }),
  }),
});

export const OwnerInput = builder.inputType("OwnerInput", {
  fields: (t) => ({
    // one of these must be set
    // (GraphQL doesn't have input unions yet; https://github.com/graphql/graphql-spec/pull/825)
    username: t.string(),
    groupSlug: t.string(),
  }),
});

export type OwnerInput = ExtractInputShape<typeof OwnerInput>;
export type ValidatedOwnerInput =
  | { type: "User"; name: string }
  | { type: "Group"; name: string };

export function validateOwner(
  owner: ExtractInputShape<typeof OwnerInput>
): ValidatedOwnerInput {
  if (owner.username) {
    if (owner.groupSlug) {
      throw new Error(
        "Invalid input, only one of `username` and `groupSlug` must be set"
      );
    }
    return { type: "User", name: owner.username };
  } else {
    if (!owner.groupSlug) {
      throw new Error(
        "Invalid input, one of `username` and `groupSlug` must be set"
      );
    }
    return { type: "Group", name: owner.groupSlug };
  }
}
