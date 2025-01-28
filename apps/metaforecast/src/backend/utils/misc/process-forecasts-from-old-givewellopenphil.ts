/* Imports */
import fs from "fs";

/* Definitions */
let locationData = "../../input";
/* Body */
let rawdata = fs.readFileSync(
  `${locationData}/givewellopenphil-questions.json`,
  { encoding: "utf-8" }
);
let data = JSON.parse(rawdata);

let results = [];
let counter = 0;
for (let datum of data) {
  let id = `givewellopenphil-2021-${counter}`;
  counter = counter + 1;
  // let probability = Math.round(Number(datum["Percentage"].replace("%", ""))) / 100;
  let result = {
    id: id,
    title: datum["title"],
    url: datum["url"],
    platform: datum["platform"],
    description: datum["description"],
    options: datum["options"],
    /*[
      {
        name: "Yes",
        probability: probability,
        type: "PROBABILITY",
      },
      {
        name: "No",
        probability: 1 - Math.round(probability * 100) / 100,
        type: "PROBABILITY",
      },
    ],
		*/
    timestamp: "2021-02-23T15∶21∶37.005Z", //new Date().toISOString(),
    qualityindicators: {
      stars: datum.qualityindicators.stars,
    },
  };
  results.push(result);
}

let string = JSON.stringify(results, null, 2);
fs.writeFileSync(`${locationData}/givewellopenphil-questions-new.json`, string);
