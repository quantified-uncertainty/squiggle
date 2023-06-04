import { builder } from "@/graphql/builder";
import { ModelRevision, ModelRevisionConnection } from "./ModelRevision";
import { decodeGlobalID } from "@pothos/plugin-relay";

export const Model = builder.prismaNode("Model", {
  id: { field: "id" },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    // I'm not yet sure if we'll use custom scalars for datetime encoding, so `createdAtTimestamp` is a precaution; we'll probably switch to `createAt` in the future
    createdAtTimestamp: t.float({
      resolve: (model) => model.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (model) => model.updatedAt.getTime(),
    }),
    currentRevision: t.relation("currentRevision", {
      nullable: false,
    }),
    revision: t.field({
      type: ModelRevision,
      args: {
        id: t.arg.id({ required: true }),
      },
      select: (args, _, nestedSelection) => {
        const { typename, id } = decodeGlobalID(String(args.id));
        if (typename !== "ModelRevision") {
          throw new Error("Expected ModelRevision id");
        }

        return {
          revisions: nestedSelection({
            take: 1,
            where: { id },
          }),
        };
      },
      async resolve(model) {
        const revision = model.revisions[0];
        if (!revision) {
          throw new Error("Not found");
        }
        return revision;
      },
    }),
    revisions: t.relatedConnection(
      "revisions",
      {
        cursor: "id",
        query: () => ({
          orderBy: {
            createdAt: "desc",
          },
        }),
      },
      ModelRevisionConnection
    ),
    owner: t.relation("owner"),
  }),
});

export const ModelConnection = builder.connectionObject({
  type: Model,
  name: "ModelConnection",
});
