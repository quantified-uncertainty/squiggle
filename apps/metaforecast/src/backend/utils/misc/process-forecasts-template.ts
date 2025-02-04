/* Imports */
import fs from "fs";

/* Definitions */
let locationData = "./data/";

/* Body */
let rawdata = fs.readFileSync("../data/merged-questions.json", {
  encoding: "utf-8",
});
let data = JSON.parse(rawdata);

let results: any[] = [];
for (let datum of data) {
  // do something
}

let string = JSON.stringify(results, null, 2);
fs.writeFileSync("../data/output.txt", string);
