import { Question } from "@prisma/client";
import axios from "axios";

import { prepareQuestion, upsertSingleQuestion } from "../robot";
import { FetchedQuestion, Platform } from "../types";
import { ElasticQuestion, questionToElasticDocument } from "../utils/elastic";

/* Definitions */
const searchEndpoint =
  "https://m629r9ugsg-dsn.algolia.net/1/indexes/Space_production/query?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.32.1&x-algolia-application-id=M629R9UGSG&x-algolia-api-key=4e893740a2bd467a96c8bfcf95b2809c";

const apiEndpoint = "https://api.getguesstimate.com";

const modelToQuestion = (model: any): ReturnType<typeof prepareQuestion> => {
  const { description } = model;
  // const description = model.description
  //   ? model.description.replace(/\n/g, " ").replace(/  /g, " ")
  //   : "";
  // const timestamp = parseISO(model.created_at);
  const fq: FetchedQuestion = {
    id: `guesstimate-${model.id}`,
    title: model.name,
    url: `https://www.getguesstimate.com/models/${model.id}`,
    // timestamp,
    description: description || "",
    options: [],
    qualityindicators: {
      numforecasts: 1,
      numforecasters: 1,
    },
    extra: {
      visualization: model.big_screenshot,
    },
    // ranking: 10 * (index + 1) - 0.5, //(model._rankingInfo - 1*index)// hack
  };
  const q = prepareQuestion(fq, guesstimate);
  return q;
};

async function search(query: string): Promise<ElasticQuestion[]> {
  const response = await axios({
    url: searchEndpoint,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: `{\"params\":\"query=${query.replace(
      / /g,
      "%20"
    )}&hitsPerPage=20&page=0&getRankingInfo=true\"}`,
    method: "POST",
  });

  const models: any[] = response.data.hits;
  const mappedModels: ElasticQuestion[] = models.map((model) => {
    const q = modelToQuestion(model);
    return questionToElasticDocument({
      ...q,
      fetched: new Date(),
      firstSeen: new Date(),
    });
  });

  // filter for duplicates. Surprisingly common.
  let uniqueTitles: string[] = [];
  let uniqueModels: ElasticQuestion[] = [];
  for (let model of mappedModels) {
    if (!uniqueTitles.includes(model.title) && !model.title.includes("copy")) {
      uniqueModels.push(model);
      uniqueTitles.push(model.title);
    }
  }

  return uniqueModels;
}

const fetchQuestion = async (id: number): Promise<Question> => {
  const response = await axios({ url: `${apiEndpoint}/spaces/${id}` });
  const q = modelToQuestion(response.data);
  return await upsertSingleQuestion(q);
};

export const guesstimate: Platform & {
  search: typeof search;
  fetchQuestion: typeof fetchQuestion;
} = {
  name: "guesstimate",
  label: "Guesstimate",
  color: "#223900",
  search,
  version: "v1",
  fetchQuestion,
  calculateStars: (q) => (q.description?.length > 250 ? 2 : 1),
  fetcher: async () => {
    console.log(`Platform Guesstimate doesn't have a fetcher, skipping`);
    return null;
  },
};
