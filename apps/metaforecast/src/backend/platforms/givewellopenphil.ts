/* Imports */
import axios from "axios";
import fs from "fs";

import { average } from "../../utils";
import { Platform } from "../types";

const platformName = "givewellopenphil";

/* Support functions */
async function fetchPage(url: string): Promise<string> {
  const response = await axios({
    url: url,
    method: "GET",
    headers: {
      "Content-Type": "text/html",
    },
  }).then((res) => res.data);
  return response;
}

/* Body */

async function main1() {
  let rawdata = fs.readFileSync("./input/givewellopenphil-urls.txt");
  let data = rawdata
    .toString()
    .split("\n")
    .filter((url) => url != "");
  // console.log(data)
  let results = [];
  for (let url of data) {
    // console.log(url)
    let page = await fetchPage(url);

    // Title
    let titleraw = page.split('<meta name="twitter:title" content="')[1];
    let title = titleraw.split('" />')[0];

    // Description
    let internalforecasts = page
      .split("<h2")
      .filter(
        (section) =>
          section.includes("Internal forecast") ||
          section.includes("internal forecast")
      );
    let description = "<h2 " + internalforecasts[1];

    const result = {
      title,
      url,
      platform: platformName,
      description,
      options: [],
      qualityindicators: {},
    }; // Note: This requires some processing afterwards
    // console.log(result)
    results.push(result);
  }
  // await databaseUpsert({
  //   contents: results,
  //   group: "givewell-questions-unprocessed",
  // });
}

export const givewellopenphil: Platform = {
  name: platformName,
  label: "GiveWell/OpenPhilanthropy",
  color: "#32407e",
  version: "v1",
  async fetcher() {
    // main1()
    return; // not necessary to refill the DB every time
    const rawdata = fs.readFileSync("./input/givewellopenphil-questions.json", {
      encoding: "utf-8",
    });
    const data = JSON.parse(rawdata);
    const dataWithDate = data.map((datum: any) => ({
      ...datum,
      platform: platformName,
      // timestamp: new Date("2021-02-23"),
    }));
    return dataWithDate;
  },
  calculateStars(data) {
    let nuno = () => 2;
    let eli = () => null;
    let misha = () => null;
    let starsDecimal = average([nuno()]); //, eli(), misha()])
    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
