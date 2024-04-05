import { client } from "@/lib/elasticSearch";

import { builder } from "../builder";
import ElasticDocument from "../types/ElasticDocument";

const foo = client;

builder.queryFields((t) => ({
  elasticSearch: t.field({
    type: [ElasticDocument],
    args: {
      query: t.arg.string(),
    },
    resolve: async (_, { query }) => {
      const foo = await client.search({
        index: "squiggleitems", // Replace with your Elasticsearch index name
        query: {
          match_all: {},
        },
      });
      console.log("HI", foo);

      return foo.hits.hits.map((hit: any) => hit._source);
    },
  }),
}));
