/* Imports */
import axios from "axios";

import { FullQuestionOption } from "../../common/types";
import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";
import { applyIfSecretExists } from "../utils/getSecrets";
import { measureTime } from "../utils/measureTime";
import { sleep } from "../utils/sleep";
import toMarkdown from "../utils/toMarkdown";

/* Definitions */
const platformName = "infer";
const htmlEndPoint = "https://www.infer-pub.com/questions";
const DEBUG_MODE: "on" | "off" = "off"; // "off"
const SLEEP_TIME_RANDOM = 7000; // miliseconds
const SLEEP_TIME_EXTRA = 2000;

/* Support functions */

function cleanDescription(text: string) {
  let md = toMarkdown(text);
  let result = md.replaceAll("---", "-").replaceAll("  ", " ");
  return result;
}

async function fetchPage(page: number, cookie: string) {
  console.log(`Page #${page}`);
  if (page == 1) {
    cookie = cookie.split(";")[0]; // Interesting that it otherwise doesn't work :(
  }
  let urlEndpoint = `${htmlEndPoint}/?page=${page}`;
  console.log(urlEndpoint);
  const response: string = await axios({
    url: urlEndpoint,
    method: "GET",
    headers: {
      "Content-Type": "text/html",
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
  if (!isSignedInBool) {
    console.log("Error: Not signed in.");
  }
  console.log(`Signed in? ${isSignedInBool ? "yes" : "no"}`);
  return isSignedInBool;
}

function reachedEnd(html: string) {
  let reachedEndBool =
    html.includes("No questions match your filter") || !html.includes("infer");
  if (reachedEndBool) {
    //console.log(html)
  }
  console.log(`Reached end? ${reachedEndBool ? "yes" : "no"}`);
  return reachedEndBool;
}

/* Body */

async function infer_inner(cookie: string) {
  let i = 1;
  let response = await fetchPage(i, cookie);
  let results: FetchedQuestion[] = [];

  await measureTime(async () => {
    // console.log("Downloading... This might take a couple of minutes. Results will be shown.")
    while (!reachedEnd(response) && isSignedIn(response)) {
      let htmlLines = response.split("\n");
      // let h4elements = htmlLines.filter(str => str.includes("<h5> <a href=") || str.includes("<h4> <a href="))
      let questionHrefs = htmlLines.filter((str) =>
        str.includes("https://www.infer-pub.com/questions/")
      );
      // console.log(questionHrefs)

      if (process.env.DEBUG_MODE == "on" || DEBUG_MODE == "on") {
        console.log("questionHrefs: ");
        console.log(questionHrefs);
      }

      for (let questionHref of questionHrefs) {
        let elementSplit = questionHref.split('"><span>');
        let url = elementSplit[0].split('<a href="')[1];
        let title = elementSplit[1]
          .replace("</h4>", "")
          .replace("</h5>", "")
          .replace("</span></a>", "");
        await sleep(Math.random() * SLEEP_TIME_RANDOM + SLEEP_TIME_EXTRA); // don't be as noticeable

        try {
          const moreinfo = await fetchStats(url, cookie);
          const questionNumRegex = new RegExp("questions/([0-9]+)");
          const questionNumMatch = url.match(questionNumRegex);
          if (!questionNumMatch) {
            throw new Error(`Couldn't find question num in ${url}`);
          }
          let questionNum = questionNumMatch[1];
          const id = `${platformName}-${questionNum}`;
          let question: FetchedQuestion = {
            id,
            title,
            url,
            ...moreinfo,
          };
          console.log(JSON.stringify(question, null, 4));
          if (
            i % 30 == 0 &&
            !(process.env.DEBUG_MODE == "on" || DEBUG_MODE == "on")
          ) {
            console.log(`Page #${i}`);
            console.log(question);
          }
          results.push(question);
          if (process.env.DEBUG_MODE == "on" || DEBUG_MODE == "on") {
            console.log(url);
            console.log(question);
          }
        } catch (error) {
          console.log(error);
          console.log(
            `We encountered some error when fetching the URL: ${url}, so it won't appear on the final json`
          );
        }
      }

      i++;

      console.log(
        "Sleeping for ~5secs so as to not be as noticeable to the infer servers"
      );
      await sleep(Math.random() * SLEEP_TIME_RANDOM + SLEEP_TIME_EXTRA); // don't be as noticeable

      try {
        response = await fetchPage(i, cookie);
      } catch (error) {
        console.log(error);
        console.log(
          `The program encountered some error when fetching page #${i}, so it won't appear on the final json. It is possible that this page wasn't actually a prediction question pages`
        );
      }
    }
  });

  if (results.length === 0) {
    console.log("Not updating results, as process was not signed in");
    return;
  }
  return results;
}

export const infer: Platform = {
  name: platformName,
  label: "Infer",
  color: "#223900",
  version: "v1",
  async fetcher() {
    let cookie = process.env.INFER_COOKIE;
    return (await applyIfSecretExists(cookie, infer_inner)) || null;
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
