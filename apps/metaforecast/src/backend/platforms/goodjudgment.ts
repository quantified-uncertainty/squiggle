/* Imports */
import axios from "axios";
import { Tabletojson } from "tabletojson";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";
import { hash } from "../utils/hash";

/* Definitions */
const platformName = "goodjudgment";
const endpoint = "https://goodjudgment.io/superforecasts/";

/* Body */
export const goodjudgment: Platform = {
  name: platformName,
  label: "Good Judgment",
  color: "#7d4f1b",
  version: "v1",
  async fetcher() {
    // Proxy fuckery
    // let proxy;
    /*
	 * try {
    proxy = await axios
      .get("http://pubproxy.com/api/proxy")
      .then((query) => query.data);
    console.log(proxy);
  } catch (error) {
    console.log("Proxy generation failed; using backup proxy instead");
    // hard-coded backup proxy
		*/
    // proxy = {
    // ip: ...
    // port: ...
    // };
    // // }
    // let agent = tunnel.httpsOverHttp({
    // proxy: {
    //     host: proxy.ip,
    //     port: proxy.port,
    // },
    // });

    const content = await axios
      .request({
        url: "https://goodjudgment.io/superforecasts/",
        method: "get",
        headers: {
          "User-Agent": "Firefox",
        },
        // agent,
        // port: 80,
      })
      .then((query) => query.data);

    // Processing
    let results: FetchedQuestion[] = [];
    let jsonTable = Tabletojson.convert(content, { stripHtmlFromCells: false });
    jsonTable.shift(); // deletes first element
    jsonTable.pop(); // deletes last element

    for (let table of jsonTable) {
      let title = table[0]["0"].split("\t\t\t").splice(3)[0];
      if (title != undefined) {
        title = title.replaceAll("</a>", "");
        const id = `${platformName}-${hash(title)}`;
        const description = table
          .filter((row: any) => row["0"].includes("BACKGROUND:"))
          .map((row: any) => row["0"])
          .map((text: any) =>
            text
              .split("BACKGROUND:")[1]
              .split("Examples of Superforecaster")[0]
              .split("AT A GLANCE")[0]
              .replaceAll("\n\n", "\n")
              .split("\n")
              .slice(3)
              .join(" ")
              .replaceAll("      ", "")
              .replaceAll("<br> ", "")
          )[0];
        const options = table
          .filter((row: any) => "4" in row)
          .map((row: any) => ({
            name: row["2"]
              .split('<span class="qTitle">')[1]
              .replace("</span>", ""),
            probability: Number(row["3"].split("%")[0]) / 100,
            type: "PROBABILITY",
          }));
        let analysis = table.filter((row: any) =>
          row[0] ? row[0].toLowerCase().includes("commentary") : false
        );
        // "Examples of Superforecaster Commentary" / Analysis
        // The following is necessary twice, because we want to check if there is an empty list, and then get the first element of the first element of the list.
        analysis = analysis ? analysis[0] : "";
        analysis = analysis ? analysis[0] : "";
        // not a duplicate
        // console.log(analysis)
        let standardObj: FetchedQuestion = {
          id,
          title,
          url: endpoint,
          description,
          options,
          qualityindicators: {},
          extra: {
            superforecastercommentary: analysis || "",
          },
        };
        results.push(standardObj);
      }
    }

    console.log(
      "Note that failing is not unexpected; see utils/pullSuperforecastsManually.sh/js"
    );

    return results;
  },
  calculateStars(data) {
    let nuno = () => 4;
    let eli = () => 4;
    let misha = () => 3.5;
    let starsDecimal = average([nuno()]); // , eli(), misha()])
    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
