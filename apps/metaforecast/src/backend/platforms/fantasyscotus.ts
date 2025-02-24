/* Imports */
import axios from "axios";

import { FetchedQuestion, Platform } from "../types";

const platformName = "fantasyscotus";

/* Definitions */
const unixtime = new Date().getTime();
const endpoint = `https://fantasyscotus.net/case/list/?filterscount=0&groupscount=0&pagenum=0&pagesize=20&recordstartindex=0&recordendindex=12&_=${unixtime}`;

async function fetchData() {
  const response = await axios({
    method: "GET",
    url: endpoint,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:87.0) Gecko/20100101 Firefox/87.0",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    // referrer: "https://fantasyscotus.net/case/list/",
    // credentials: "omit",
    // mode: "cors",
  }).then((res) => res.data);

  return response;
}

async function getPredictionsData(caseUrl: string) {
  const newCaseUrl = `https://fantasyscotus.net/user-predictions${caseUrl}?filterscount=0&groupscount=0&sortdatafield=username&sortorder=asc&pagenum=0&pagesize=20&recordstartindex=0&recordendindex=20&_=${unixtime}`;

  const predictions = await axios({
    method: "GET",
    url: newCaseUrl,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:87.0) Gecko/20100101 Firefox/87.0",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    // referrer: newCaseUrl,
    // credentials: "include",
    // mode: "cors",
  }).then((res) => res.data);

  const predictionsAffirm = predictions.filter(
    (prediction: any) => prediction.percent_affirm > 50
  );

  return {
    numAffirm: predictionsAffirm.length,
    proportionAffirm: predictionsAffirm.length / predictions.length,
    numForecasts: predictions.length,
  };
}

async function processData(data: any) {
  const events = data.object_list;
  const historicalPercentageCorrect = data.stats.pcnt_correct;
  const historicalProbabilityCorrect =
    Number(historicalPercentageCorrect.replace("%", "")) / 100;

  const results: FetchedQuestion[] = [];
  for (let event of events) {
    if (event.accuracy == "") {
      let id = `${platformName}-${event.id}`;
      // if the thing hasn't already resolved
      let predictionData = await getPredictionsData(event.docket_url);
      let pAffirm = predictionData.proportionAffirm;
      //let trackRecord = event.prediction.includes("Affirm") ? historicalProbabilityCorrect : 1-historicalProbabilityCorrect
      let eventObject: FetchedQuestion = {
        id: id,
        title: `In ${event.short_name}, the SCOTUS will affirm the lower court's decision`,
        url: `https://fantasyscotus.net/user-predictions${event.docket_url}`,
        description: `${(pAffirm * 100).toFixed(2)}% (${
          predictionData.numAffirm
        } out of ${
          predictionData.numForecasts
        }) of FantasySCOTUS players predict that the lower court's decision will be affirmed. FantasySCOTUS overall predicts an outcome of ${
          event.prediction
        }. Historically, FantasySCOTUS has chosen the correct side ${historicalPercentageCorrect} of the time.`,
        options: [
          {
            name: "Yes",
            probability: pAffirm,
            type: "PROBABILITY",
          },
          {
            name: "No",
            probability: 1 - pAffirm,
            type: "PROBABILITY",
          },
        ],
        qualityindicators: {
          numforecasts: Number(predictionData.numForecasts),
        },
      };
      results.push(eventObject);
    }
  }

  return results;
}

export const fantasyscotus: Platform = {
  name: platformName,
  label: "FantasySCOTUS",
  color: "#231149",

  async fetcher() {
    const rawData = await fetchData();
    const questions = await processData(rawData);
    return { questions };
  },

  calculateStars() {
    return 2;
  },
};
