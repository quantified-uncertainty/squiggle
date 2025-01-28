/* Imports */
import axios from "axios";

import { FullQuestionOption } from "../../common/types";
import { average } from "../../utils";
import { Platform } from "../types";
import { applyIfSecretExists } from "../utils/getSecrets";
import { sleep } from "../utils/sleep";
import toMarkdown from "../utils/toMarkdown";

/* Definitions */
const platformName = "goodjudgmentopen";

const htmlEndPoint = "https://www.gjopen.com/questions?page=";
const annoyingPromptUrls = [
  "https://www.gjopen.com/questions/1933-what-forecasting-questions-should-we-ask-what-questions-would-you-like-to-forecast-on-gjopen",
  "https://www.gjopen.com/questions/1779-are-there-any-forecasting-tips-tricks-and-experiences-you-would-like-to-share-and-or-discuss-with-your-fellow-forecasters",
  "https://www.gjopen.com/questions/2246-are-there-any-forecasting-tips-tricks-and-experiences-you-would-like-to-share-and-or-discuss-with-your-fellow-forecasters-2022-thread",
  "https://www.gjopen.com/questions/2237-what-forecasting-questions-should-we-ask-what-questions-would-you-like-to-forecast-on-gjopen",
  "https://www.gjopen.com/questions/2437-what-forecasting-questions-should-we-ask-what-questions-would-you-like-to-forecast-on-gjopen",
];
const DEBUG_MODE: "on" | "off" = "off"; // "on"
const id = () => 0;

/* Support functions */

function cleanDescription(text: string) {
  let md = toMarkdown(text);
  let result = md.replaceAll("---", "-").replaceAll("  ", " ");
  return result;
}

async function fetchPage(page: number, cookie: string) {
  const response: string = await axios({
    url: htmlEndPoint + page,
    method: "GET",
    headers: {
      Cookie: cookie,
    },
  }).then((res) => res.data);
  // console.log(response)
  return response;
}

async function fetchStats(questionUrl: string, cookie: string) {
  let response: string = await axios({
    url: questionUrl + "/stats",
    method: "GET",
    headers: {
      "Content-Type": "text/html",
      Cookie: cookie,
      Referer: questionUrl,
    },
  }).then((res) => res.data);

  if (response.includes("Sign up or sign in to forecast")) {
    throw Error("Not logged in");
  }
  // Init
  let options: FullQuestionOption[] = [];

  // Parse the embedded json
  let htmlElements = response.split("\n");
  let jsonLines = htmlElements.filter((element) =>
    element.includes("data-react-props")
  );
  let embeddedJsons = jsonLines.map((jsonLine, i) => {
    let innerJSONasHTML = jsonLine.split('data-react-props="')[1].split('"')[0];
    let json = JSON.parse(innerJSONasHTML.replaceAll("&quot;", '"'));
    return json;
  });
  let firstEmbeddedJson = embeddedJsons[0];
  let title = firstEmbeddedJson.question.name;
  let description = cleanDescription(firstEmbeddedJson.question.description);
  let comments_count = firstEmbeddedJson.question.comments_count;
  let numforecasters = firstEmbeddedJson.question.predictors_count;
  let numforecasts = firstEmbeddedJson.question.prediction_sets_count;
  let questionType = firstEmbeddedJson.question.type;
  if (
    questionType.includes("Binary") ||
    questionType.includes("NonExclusiveOpinionPoolQuestion") ||
    questionType.includes("Forecast::Question") ||
    !questionType.includes("Forecast::MultiTimePeriodQuestion")
  ) {
    options = firstEmbeddedJson.question.answers.map((answer: any) => ({
      name: answer.name,
      probability: answer.normalized_probability,
      type: "PROBABILITY",
    }));
    if (options.length == 1 && options[0].name == "Yes") {
      let probabilityNo =
        options[0].probability > 1
          ? 1 - options[0].probability / 100
          : 1 - options[0].probability;
      options.push({
        name: "No",
        probability: probabilityNo,
        type: "PROBABILITY",
      });
    }
  }
  let result = {
    description: description,
    options: options,
    qualityindicators: {
      numforecasts: Number(numforecasts),
      numforecasters: Number(numforecasters),
      comments_count: Number(comments_count),
    },
  };
  // console.log(JSON.stringify(result, null, 4));
  return result;
}

function isSignedIn(html: string) {
  let isSignedInBool = !(
    html.includes("You need to sign in or sign up before continuing") ||
    html.includes("Sign up")
  );
  // console.log(html)
  if (!isSignedInBool) {
    console.log("Error: Not signed in.");
  }
  console.log(`is signed in? ${isSignedInBool ? "yes" : "no"}`);
  return isSignedInBool;
}

function reachedEnd(html: string) {
  let reachedEndBool =
    html.includes("No questions match your filter") ||
    !html.includes("Good Judgment");
  if (reachedEndBool) {
    // console.log(html)
  }
  console.log(`Reached end? ${reachedEndBool}`);
  return reachedEndBool;
}

/* Body */

async function goodjudgmentopen_inner(cookie: string) {
  let i = 1;
  let response = await fetchPage(i, cookie);

  let results = [];
  let init = Date.now();
  // console.log("Downloading... This might take a couple of minutes. Results will be shown.")
  console.log("Page #1");
  while (!reachedEnd(response) && isSignedIn(response)) {
    let htmlLines = response.split("\n");
    DEBUG_MODE == "on" ? htmlLines.forEach((line) => console.log(line)) : id();
    let h5elements = htmlLines.filter((str) => str.includes("<h5> <a href="));
    DEBUG_MODE == "on" ? console.log(h5elements) : id();
    let j = 0;
    for (let h5element of h5elements) {
      let h5elementSplit = h5element.split('"><span>');
      let url = h5elementSplit[0].split('<a href="')[1];
      if (!annoyingPromptUrls.includes(url)) {
        let title = h5elementSplit[1].replace("</span></a></h5>", "");
        await sleep(1000 + Math.random() * 1000); // don't be as noticeable
        try {
          let moreinfo = await fetchStats(url, cookie);
          /*if (moreinfo.isbinary) {
            if (! moreinfo.crowdpercentage) { // then request again.
              moreinfo = await fetchStats(url, cookie);
            }
          }*/
          let questionNumRegex = new RegExp("questions/([0-9]+)");
          const questionNumMatch = url.match(questionNumRegex);
          if (!questionNumMatch) {
            throw new Error(`Couldn't find question num in ${url}`);
          }
          let questionNum = questionNumMatch[1];
          let id = `${platformName}-${questionNum}`;
          let question = {
            id: id,
            title: title,
            url: url,
            platform: platformName,
            ...moreinfo,
          };
          if (j % 30 == 0 || DEBUG_MODE == "on") {
            console.log(`Page #${i}`);
            console.log(question);
          } else {
            console.log(question.title);
          }
          // console.log(question)
          results.push(question);
        } catch (error) {
          console.log(error);
          console.log(
            `We encountered some error when fetching the URL: ${url}, so it won't appear on the final json`
          );
        }
      }
      j = j + 1;
    }
    i = i + 1;
    // console.log("Sleeping for 5secs so as to not be as noticeable to the gjopen servers")
    await sleep(5000 + Math.random() * 1000); // don't be a dick to gjopen server

    try {
      response = await fetchPage(i, cookie);
    } catch (error) {
      console.log(error);
      console.log(
        `We encountered some error when fetching page #${i}, so it won't appear on the final json`
      );
    }
  }

  if (results.length === 0) {
    console.log("Not updating results, as process was not signed in");
    return;
  }

  let end = Date.now();
  let difference = end - init;
  console.log(
    `Took ${difference / 1000} seconds, or ${difference / (1000 * 60)} minutes.`
  );

  return results;
}

export const goodjudgmentopen: Platform = {
  name: platformName,
  label: "Good Judgment Open",
  color: "#002455",
  version: "v1",
  async fetcher() {
    let cookie = process.env.GOODJUDGMENTOPENCOOKIE;
    return (await applyIfSecretExists(cookie, goodjudgmentopen_inner)) || null;
  },
  calculateStars(data) {
    let minProbability = Math.min(
      ...data.options.map((option) => option.probability || 0)
    );
    let maxProbability = Math.max(
      ...data.options.map((option) => option.probability || 0)
    );

    let nuno = () =>
      Number(data.qualityindicators.numforecasts || 0) > 100 ? 3 : 2;
    let eli = () => 3;
    let misha = () =>
      minProbability > 0.1 || maxProbability < 0.9 ? 3.1 : 2.5;

    let starsDecimal = average([nuno(), eli(), misha()]);
    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
