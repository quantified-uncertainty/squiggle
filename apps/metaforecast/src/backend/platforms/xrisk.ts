import fs from "fs";

import { Platform } from "../types";
import { hash } from "../utils/hash";

const platformName = "xrisk";

export const xrisk: Platform = {
  name: "xrisk",
  label: "X-risk estimates",
  color: "#272600",
  version: "v1",
  async fetcher() {
    // return; // not necessary to refill the DB every time
    let fileRaw = fs.readFileSync("./input/xrisk-questions.json", {
      encoding: "utf-8",
    });
    let parsedData = JSON.parse(fileRaw);
    const results = parsedData.map((item: any) => {
      item.extra = item.moreoriginsdata;
      delete item.moreoriginsdata;
      return {
        ...item,
        id: `${platformName}-${hash(item.title + " | " + item.url)}`, // some titles are non-unique, but title+url pair is always unique
      };
    });
    return results;
  },
  calculateStars: () => 2,
};
