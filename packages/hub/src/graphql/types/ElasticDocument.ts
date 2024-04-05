// src/graphql/types/ElasticDocument.ts
import { builder } from "../builder";

interface ElasticDocument {
  id: string;
  type: string;
  slug: string;
  owner: string;
  code: string;
}

const ElasticDocument = builder
  .objectRef<ElasticDocument>("ElasticDocument")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      type: t.exposeString("type"),
      slug: t.exposeString("slug"),
      owner: t.exposeString("owner"),
      code: t.exposeString("code"),
    }),
  });

export default ElasticDocument;
