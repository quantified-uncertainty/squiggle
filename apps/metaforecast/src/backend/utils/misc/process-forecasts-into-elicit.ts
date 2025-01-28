/* Imports */
import fs from "fs";

import { QualityIndicators } from "@/backend/types";

import { prisma } from "../../database/prisma";

/* Definitions */
let locationData = "./data/";

/* Body */
// let rawdata =  fs.readFileSync("./data/merged-questions.json") // run from topmost folder, not from src
async function main() {
  const data = await prisma.question.findMany({});
  const processDescription = (description: string | null | undefined) => {
    if (description == null || description == undefined || description == "") {
      return "";
    } else {
      description =
        description == null
          ? ""
          : description
              .replaceAll("] (", "](")
              .replaceAll(") )", "))")
              .replaceAll("( [", "([")
              .replaceAll(") ,", "),")
              .replaceAll("\n", " ");
      if (description.length > 1000) {
        return description.slice(0, 1000) + "...";
      } else {
        return description;
      }
    }
  };

  let results = [];
  for (const datum of data) {
    // do something
    const description = processDescription(datum["description"]);
    const forecasts = datum["qualityindicators"]
      ? (datum["qualityindicators"] as object as QualityIndicators).numforecasts
      : "unknown";
    const stars = datum["qualityindicators"]
      ? (datum["qualityindicators"] as object as QualityIndicators).stars
      : 2;
    results.push("Title: " + datum["title"]);
    results.push("URL: " + datum["url"]);
    results.push("Platform: " + datum["platform"]);
    results.push("Description: " + description);
    results.push("Number of forecasts: " + forecasts);
    results.push("Stars: " + forecasts);
    results.push("\n");
  }

  let string = results.join("\n");
  string = string.replaceAll("\n\n", "\n");

  fs.writeFileSync("elicit-output.txt", string);
}
main();
