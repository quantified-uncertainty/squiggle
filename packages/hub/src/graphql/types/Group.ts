import { builder } from "../builder";

export const Group = builder.prismaNode("Group", {
  id: { field: "id" },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    createdAtTimestamp: t.float({
      resolve: (group) => group.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (group) => group.updatedAt.getTime(),
    }),
  }),
});

export const GroupConnection = builder.connectionObject({
  type: Group,
  name: "GroupConnection",
});
