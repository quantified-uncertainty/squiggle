import axios from "axios";
import { JSDOM } from "jsdom";

import { FetchedQuestion, Platform } from "../types";
import toMarkdown from "../utils/toMarkdown";

const platformName = "rootclaim";
const jsonEndpoint =
  "https://live-rootclaim-backend.herokuapp.com/analysis/public-list?limit=1000&offset=0";

async function fetchAllRootclaims() {
  console.log(`Fetching ${jsonEndpoint}`);
  const response = await axios
    .get(jsonEndpoint)
    .then((response) => response.data);

  const claims = response.result.main_page_stories;
  if (typeof claims !== "object") {
    throw new Error("Expected result.main_page_stories field in API response");
  }
  return claims;
}

async function fetchDescription(url: string, isclaim: boolean) {
  console.log(`Fetching description for ${url}`);
  const response = await axios.get(url).then((response) => response.data);

  const { document } = new JSDOM(response).window;
  const nextDataEl = document.querySelector("#__NEXT_DATA__");
  if (!nextDataEl) {
    throw new Error(`Couldn't find __NEXT_DATA__ for ${url}`);
  }

  const data = JSON.parse(nextDataEl.innerHTML);
  const mainData = data?.props?.pageProps?.initialReduxState?.main;
  const info = isclaim
    ? mainData?.claim?.background
    : mainData?.analise?.background_info;

  if (!info) {
    throw new Error(`Couldn't find description for page ${url}`);
  }
  return info;
}

export const rootclaim: Platform = {
  name: platformName,
  label: "Rootclaim",
  color: "#0d1624",

  async fetcher() {
    const claims = await fetchAllRootclaims();
    const questions: FetchedQuestion[] = [];

    for (const claim of claims) {
      const id = `${platformName}-${claim.slug.toLowerCase()}`;

      const options: FetchedQuestion["options"] = [];
      for (const scenario of claim.scenarios) {
        options.push({
          name: toMarkdown(scenario.name || scenario.text)
            .replace("\n", "")
            .replace("&#39;", "'"),
          probability: scenario.net_prob / 100,
          type: "PROBABILITY",
        });
      }

      const claimUrlPath = claim.isclaim ? "claims" : "analysis";
      const url = `https://www.rootclaim.com/${claimUrlPath}/${claim.slug}`;

      const description = await fetchDescription(url, claim.isclaim);

      const obj: FetchedQuestion = {
        id,
        title: toMarkdown(claim.question).replace("\n", ""),
        url,
        description: toMarkdown(description).replace("&#39;", "'"),
        options,
        qualityindicators: {
          numforecasts: 1,
        },
      };
      questions.push(obj);
    }
    return { questions };
  },

  calculateStars() {
    return 4; // Nuño
  },
};
