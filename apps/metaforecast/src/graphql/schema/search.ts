import { SearchHit } from "@elastic/elasticsearch/lib/api/types";

import { guesstimate } from "../../backend/platforms/guesstimate";
import { ElasticQuestion } from "../../backend/utils/elastic";
import { searchWithElastic } from "../../web/worker/searchWithElastic";
import { builder } from "../builder";
import { QuestionObj } from "./questions";

const SearchInput = builder.inputType("SearchInput", {
  fields: (t) => ({
    query: t.string({ required: true }),
    starsThreshold: t.int({
      description: "Minimum number of stars on a question",
    }),
    forecastsThreshold: t.int({
      description: "Minimum number of forecasts on a question",
    }),
    forecastingPlatforms: t.stringList({
      description: "List of platform ids to filter by",
    }),
    limit: t.int(),
  }),
});

builder.queryField("searchQuestions", (t) =>
  t.field({
    type: [QuestionObj],
    description:
      "Search for questions; uses Elasticsearch instead of the primary metaforecast database",
    args: {
      input: t.arg({ type: SearchInput, required: true }),
    },
    resolve: async (parent, { input }) => {
      // defs
      const query = input.query === undefined ? "" : input.query;
      if (query === "") return [];
      const { forecastsThreshold, starsThreshold } = input;

      const platformsIncludeGuesstimate =
        input.forecastingPlatforms?.includes("guesstimate") &&
        (!starsThreshold || starsThreshold <= 1);

      // preparation
      const unawaitedElasticResponse = searchWithElastic({
        queryString: query,
        hitsPerPage: input.limit ?? 50,
        starsThreshold: starsThreshold ?? undefined,
        filterByPlatforms: input.forecastingPlatforms ?? undefined,
        forecastsThreshold: forecastsThreshold ?? undefined,
      });

      let results: ElasticQuestion[] = [];

      const toDocs = (hits: SearchHit<ElasticQuestion>[]) =>
        hits
          .map((hit) => hit._source)
          .filter((doc): doc is NonNullable<typeof doc> => !!doc);

      // consider the guesstimate and the non-guesstimate cases separately.
      if (platformsIncludeGuesstimate) {
        const [responsesNotGuesstimate, responsesGuesstimate] =
          await Promise.all([
            unawaitedElasticResponse,
            guesstimate.search(query),
          ]); // faster than two separate requests
        results = [...toDocs(responsesNotGuesstimate), ...responsesGuesstimate];
      } else {
        results = toDocs(await unawaitedElasticResponse);
      }

      return results.map((q) => ({
        ...q,
        fetched: new Date(q.fetched),
        firstSeen: new Date(q.firstSeen),
      }));
    },
  })
);
