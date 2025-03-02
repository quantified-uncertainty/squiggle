import fs from "fs";

import { Platform } from "../types";
import { hash } from "../utils/hash";

const platformName = "xrisk";

/*
 * Original source of data: https://docs.google.com/spreadsheets/d/1W10B6NJjicD8O0STPiT3tNV3oFnT8YsfjmtYR8RO_RI/edit?gid=0#gid=0
 */

export const xrisk: Platform = {
  name: "xrisk",
  label: "X-risk estimates",
  color: "#272600",

  async fetcher() {
    // return; // not necessary to refill the DB every time
    const fileRaw = fs.readFileSync("./input/xrisk-questions.json", {
      encoding: "utf-8",
    });
    const parsedData = JSON.parse(fileRaw);
    const results = parsedData.map((item: any) => {
      item.extra = item.moreoriginsdata;
      delete item.moreoriginsdata;
      return {
        ...item,
        id: `${platformName}-${hash(item.title + " | " + item.url)}`, // some titles are non-unique, but title+url pair is always unique
      };
    });
    return { questions: results };
  },

  calculateStars() {
    return 2;
  },
};
