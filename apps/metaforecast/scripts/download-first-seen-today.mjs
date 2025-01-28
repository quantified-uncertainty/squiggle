/* Imports */
import fs from "fs";
import axios from "axios";

/* Definitions */
const VERBOSE = true;
let ISO_DATE_TODAY = new Date().toISOString().slice(0, 10);
let print = (message) => (VERBOSE ? console.log(message) : null);
let graphQLendpoint = "https://metaforecast.org/api/graphql";
let buildQuery = (endCursor) => `{
  questions(first: 1000 ${
    !!endCursor ? `after: "${endCursor}"` : ""
  } orderBy: FIRST_SEEN_DESC) {
    edges {
      node {
        id
        title
        url
        description
        options {
          name
          probability
        }
        qualityIndicators {
          numForecasts
          stars
        }
        firstSeenStr
				fetchedStr
      }
    }
    pageInfo {
      endCursor
      startCursor
    }
  }
}
`;

/* Support functions */
let getSomeMetaforecastPredictions = async (query) => {
  let response = await axios({
    url: graphQLendpoint,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ query: query }),
  })
    .then((res) => res.data)
    .then((res) => res.data); // not a typo
  return response;
};

let save = (questions) => {
  print("Saving Results");
  fs.writeFileSync("forecasts-today.json", JSON.stringify(questions, null, 4));
};

let getNodes = (questions) => {
  let edges = questions.edges;
  let nodes = edges.map((edge) => edge.node);
  return nodes;
};
// main
let getAllMetaforecastPredictions = async () => {
  print("Fetching forecasts");
  let results = [];
  let firstQuery = await getSomeMetaforecastPredictions(buildQuery());
  let nodes = getNodes(firstQuery.questions);
  let nodesToday = nodes.filter(
    (node) => node.firstSeenStr.slice(0, 10) == ISO_DATE_TODAY
  );
  results.push(...nodesToday);
  let endCursor = firstQuery.questions.pageInfo.endCursor;
  while (endCursor && nodesToday.length > 0) {
    print("Cursor: " + endCursor);
    let queryResults = await getSomeMetaforecastPredictions(
      buildQuery(endCursor)
    );
    let nodes = getNodes(queryResults.questions);
    nodesToday = nodes.filter(
      (node) => node.firstSeenStr.slice(0, 10) == ISO_DATE_TODAY
    );
    results.push(...nodesToday);
    endCursor = queryResults.questions.pageInfo.endCursor;
  }
  //results = results.map((result) => result.node);
  save(results);
  return results;
};

getAllMetaforecastPredictions();
