import { Client as ElasticClient } from "@elastic/elasticsearch";
import {
  QueryDslQueryContainer,
  SearchHit,
} from "@elastic/elasticsearch/lib/api/types";

import { ElasticQuestion } from "../../backend/utils/elastic";

let _CACHED_CLIENT: ElasticClient | null = null;
function getClient() {
  if (!_CACHED_CLIENT) {
    _CACHED_CLIENT = new ElasticClient({
      node: process.env.ELASTIC_HOST,
      auth: {
        username: process.env.ELASTIC_USER!,
        password: process.env.ELASTIC_PASSWORD!,
      },
    });
  }
  return _CACHED_CLIENT;
}

const INDEX_NAME = process.env.ELASTIC_INDEX!;

interface SearchOpts {
  queryString: string;
  hitsPerPage?: number;
  starsThreshold?: number;
  filterByPlatforms?: string[];
  forecastsThreshold?: number;
}

function buildFilter({
  starsThreshold,
  filterByPlatforms,
  forecastsThreshold,
}: Pick<
  SearchOpts,
  "starsThreshold" | "filterByPlatforms" | "forecastsThreshold"
>) {
  const filters: QueryDslQueryContainer[] = [];

  if (starsThreshold) {
    filters.push({
      range: {
        "qualityindicators.stars": {
          gte: starsThreshold,
        },
      },
    });
  }

  if (filterByPlatforms) {
    filters.push({
      terms: {
        platform: filterByPlatforms,
      },
    });
  }

  if (forecastsThreshold && forecastsThreshold > 0) {
    filters.push({
      range: {
        "qualityindicators.numforecasts": {
          gte: forecastsThreshold,
        },
      },
    });
  }

  return filters;
}

function noExactMatch(queryString: string, result: SearchHit<ElasticQuestion>) {
  queryString = queryString.toLowerCase();

  const title = result._source?.title.toLowerCase();
  const description = result._source?.description.toLowerCase();
  const optionsstringforsearch = (
    result._source?.optionsstringforsearch || ""
  ).toLowerCase();

  return !(
    title?.includes(queryString) ||
    description?.includes(queryString) ||
    optionsstringforsearch.includes(queryString)
  );
}

// only query string
export async function searchWithElastic({
  queryString,
  hitsPerPage = 5,
  starsThreshold,
  filterByPlatforms,
  forecastsThreshold,
}: SearchOpts): Promise<SearchHit<ElasticQuestion>[]> {
  const response = await getClient().search<ElasticQuestion>({
    index: INDEX_NAME,
    sort: [{ "qualityindicators.stars": "desc" }, "_score"],
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: queryString,
              fields: [
                "title^5",
                "description",
                "optionsstringforsearch",
                "platform",
              ],
            },
          },
        ],
        filter: buildFilter({
          starsThreshold,
          forecastsThreshold,
          filterByPlatforms,
        }),
      },
    },
    size: hitsPerPage,
  });

  let results = response.hits.hits;

  let recursionError = ["metaforecast", "metaforecasts", "metaforecasting"];
  if (
    (!results || results.length === 0) &&
    !recursionError.includes(queryString.toLowerCase())
  ) {
    results = [
      {
        _id: "not-found",
        _index: "FAKE",
        _source: {
          id: "not-found",
          objectID: "not-found",
          title: "No search results match your query",
          url: "https://metaforecast.org",
          platform: "metaforecast",
          platformLabel: "metaforecast",
          description:
            "Maybe try a broader query, e.g., reduce the number of 'stars' by clicking in 'Advanced options'?",
          options: [
            {
              name: "Yes",
              probability: 0.995,
              type: "PROBABILITY",
            },
            {
              name: "No",
              probability: 0.005,
              type: "PROBABILITY",
            },
          ],
          fetched: new Date().toISOString(),
          firstSeen: new Date().toISOString(),
          qualityindicators: {
            numforecasts: 1,
            numforecasters: 1,
            stars: 5,
          },
          extra: {},
        },
      },
    ];
  } else if (recursionError.includes(queryString.toLowerCase())) {
    results = [
      {
        _id: "recursion-error",
        _index: "FAKE",
        _source: {
          id: "recursion-error",
          objectID: "recursion-error",
          title: `Did you mean: ${queryString}?`,
          url: "https://metaforecast.org/recursion?bypassEasterEgg=true",
          platform: "metaforecast",
          platformLabel: "metaforecast",
          description:
            "Fatal error: Too much recursion. Click to proceed anyways",
          fetched: new Date().toISOString(),
          firstSeen: new Date().toISOString(),
          options: [
            {
              name: "Yes",
              probability: 0.995,
              type: "PROBABILITY",
            },
            {
              name: "No",
              probability: 0.005,
              type: "PROBABILITY",
            },
          ],
          qualityindicators: {
            numforecasts: 1,
            numforecasters: 1,
            stars: 5,
          },
          extra: {},
        },
      },
      ...results,
    ];
  } else if (
    queryString &&
    queryString.split(" ").length == 1 &&
    noExactMatch(queryString, results[0])
  ) {
    results.unshift({
      _id: "not-found-2",
      _index: "FAKE",
      _source: {
        id: "not-found-2",
        objectID: "not-found-2",
        title: "No search results appear to match your query",
        url: "https://metaforecast.org",
        platform: "metaforecast",
        platformLabel: "metaforecast",
        description:
          "Maybe try a broader query? Maybe try a broader query, e.g., reduce the number of 'stars' by clicking in 'Advanced options'? That said, we could be wrong.",
        options: [
          {
            name: "Yes",
            probability: 0.65,
            type: "PROBABILITY",
          },
          {
            name: "No",
            probability: 0.35,
            type: "PROBABILITY",
          },
        ],
        fetched: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        qualityindicators: {
          numforecasts: 1,
          numforecasters: 1,
          stars: 1,
        },
        extra: {},
      },
    });
  }

  return results;
}
// Examples:
// searchWithElastic({queryString: "Life"}, () => null)
// searchWithElastic({queryString: "Life", forecastsThreshold: 100}, () => null)
// searchWithElastic({queryString: "Life", forecastsThreshold: 100, starsThreshold: 4}, () => null)
// searchWithElastic({queryString: "Life", forecastsThreshold: 100, starsThreshold: 3, filterByPlatforms: ["Metaculus", "PolyMarket"]}, () => null)
