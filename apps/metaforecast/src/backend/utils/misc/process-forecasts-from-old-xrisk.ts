/* Imports */
import fs from "fs";

/* Definitions */
let locationData = "../../data/";

/* Body */
let rawdata = fs.readFileSync(
  "/home/nuno/Documents/core/software/fresh/js/metaforecasts/metaforecasts-current/data/xrisk-questions-raw.json",
  { encoding: "utf-8" }
);
let data = JSON.parse(rawdata);

let results = [];
for (let datum of data) {
  let probability = datum["probability"];
  let description = datum["actualEstimate"]
    ? `Actual estimate: ${datum["actualEstimate"]}

${datum["description"]}`
    : datum["description"];
  let author = `${datum["platform"]} (~${datum["date_approx"]})`;
  let result = {
    title: datum["title"],
    url: datum["url"],
    platform: "X-risk estimates",
    author: author,
    description: description,
    options: [
      {
        name: "Yes",
        probability: probability,
        type: "PROBABILITY",
      },
      {
        name: "No",
        probability: 1 - probability,
        type: "PROBABILITY",
      },
    ],
    timestamp: new Date().toISOString(),
    qualityindicators: {
      stars: 2,
    },
  };
  results.push(result);
}

let string = JSON.stringify(results, null, 2);
fs.writeFileSync(
  "/home/nuno/Documents/core/software/fresh/js/metaforecasts/metaforecasts-current/data/xrisk-questions-new.json",
  string
);
