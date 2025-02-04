/* Imports */
import fs from "fs";
import axios from "axios";

/* Definitions */
const VERBOSE = true;
let print = (message) => (VERBOSE ? console.log(message) : null);
let graphQLendpoint = "https://metaforecast.org/api/graphql";
let buildQuery = (endCursor) => `{
  questions(first: 1000 ${!!endCursor ? `after: "${endCursor}"` : ""}) {
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
  fs.writeFileSync("forecasts.json", JSON.stringify(questions, null, 4));
  let tsvHeaders = "title\tplatform\tdate\tforecast\n";
  let tsvRows = questions
    .map(
      (question) =>
        `${question.title}\t${question.platform}\t${
          question.timestamp
        }\t${JSON.stringify(question.options)}`
    )
    .join("\n");
  let tsvFile = tsvHeaders + tsvRows;
  print("Saving results to results.tsv");
  fs.writeFileSync("forecasts.tsv", tsvFile);
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
  results.push(...getNodes(firstQuery.questions));
  let endCursor = firstQuery.questions.pageInfo.endCursor;
  while (endCursor) {
    print("Cursor: " + endCursor);
    let queryResults = await getSomeMetaforecastPredictions(
      buildQuery(endCursor)
    );
    let nodes = getNodes(queryResults.questions);
    results.push(...nodes);
    endCursor = queryResults.questions.pageInfo.endCursor;
  }
  //results = results.map((result) => result.node);
  save(results);
  return results;
};

getAllMetaforecastPredictions();
