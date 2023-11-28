import { builder } from "../builder";

// Note: Owner table is not mapped to GraphQL type. This interface is a proxy for `User` and `Group`.
// common for User and Group
export const Owner = builder.interfaceRef<{ id: string }>("Owner").implement({
  resolveType: (obj) => {
    return (obj as any)._owner.type;
  },
  fields: (t) => ({
    id: t.exposeID("id"),
    slug: t.string(), // implemented on User and Group
  }),
});
