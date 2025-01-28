import { saveQuestions } from "@/backend/robot";
import { FetchedQuestion, Platform } from "@/backend/types";

import { average } from "../../../utils";
import { sleep } from "../../utils/sleep";
import {
  ApiCommon,
  ApiMultipleQuestions,
  ApiPredictable,
  ApiQuestion,
  fetchApiQuestions,
  fetchSingleApiQuestion,
} from "./api";

const platformName = "metaculus";
const now = new Date().toISOString();
const SLEEP_TIME = 1000;

async function apiQuestionToFetchedQuestions(
  apiQuestion: ApiQuestion
): Promise<FetchedQuestion[]> {
  // one item can expand:
  // - to 0 questions if we don't want it;
  // - to 1 question if it's a simple forecast
  // - to multiple questions if it's a group (see https://github.com/quantified-uncertainty/metaforecast/pull/84 for details)

  const skip = (q: ApiPredictable): boolean => {
    if (q.publish_time > now || now > q.resolve_time) {
      return true;
    }
    if (q.prediction_count < 10) {
      return true;
    }
    return false;
  };

  const buildFetchedQuestion = (
    q: ApiPredictable & ApiCommon
  ): Omit<FetchedQuestion, "url" | "description" | "title"> => {
    const isBinary = q.possibilities.type === "binary";
    let options: FetchedQuestion["options"] = [];
    if (isBinary) {
      const probability = q.community_prediction?.full.q2;
      if (probability !== undefined) {
        options = [
          {
            name: "Yes",
            probability: probability,
            type: "PROBABILITY",
          },
          {
            name: "No",
            probability: 1 - probability,
            type: "PROBABILITY",
          },
        ];
      }
    }
    return {
      id: `${platformName}-${q.id}`,
      options,
      qualityindicators: {
        numforecasts: q.prediction_count,
      },
      extra: {
        resolution_data: {
          publish_time: apiQuestion.publish_time,
          resolution: apiQuestion.resolution,
          close_time: apiQuestion.close_time,
          resolve_time: apiQuestion.resolve_time,
        },
      },
    };
  };

  if (apiQuestion.type === "group") {
    await sleep(SLEEP_TIME);
    let apiQuestionDetailsTemp;
    try {
      apiQuestionDetailsTemp = await fetchSingleApiQuestion(apiQuestion.id);
    } catch (error) {
      console.log(error);
      return [];
    }
    const apiQuestionDetails = apiQuestionDetailsTemp;
    if (apiQuestionDetails.type !== "group") {
      console.log("Error: expected `group` type");
      return []; //throw new Error("Expected `group` type"); // shouldn't happen, this is mostly for typescript
    } else {
      try {
        let result = (apiQuestionDetails.sub_questions || [])
          .filter((q) => !skip(q))
          .map((sq) => {
            const tmp = buildFetchedQuestion(sq);
            return {
              ...tmp,
              title: `${apiQuestion.title} (${sq.title})`,
              description: apiQuestionDetails.description || "",
              url: `https://www.metaculus.com${apiQuestion.page_url}?sub-question=${sq.id}`,
            };
          });
        return result;
      } catch (error) {
        console.log(error);
        return [];
      }
    }
  } else if (apiQuestion.type === "forecast") {
    if (apiQuestion.group) {
      return []; // sub-question, should be handled on the group level
    }
    if (skip(apiQuestion)) {
      console.log(`- [Skipping]: ${apiQuestion.title}`);
      /*console.log(`Close time: ${
        apiQuestion.close_time
      }, resolve time: ${
        apiQuestion.resolve_time
      }`)*/
      return [];
    }

    await sleep(SLEEP_TIME);
    try {
      const apiQuestionDetails = await fetchSingleApiQuestion(apiQuestion.id);
      const tmp = buildFetchedQuestion(apiQuestion);
      return [
        {
          ...tmp,
          title: apiQuestion.title,
          description: apiQuestionDetails.description || "",
          url: "https://www.metaculus.com" + apiQuestion.page_url,
        },
      ];
    } catch (error) {
      console.log(error);
      return [];
    }
  } else {
    if (apiQuestion.type !== "claim") {
      // should never happen, since `discriminator` in JTD schema causes a strict runtime check
      console.log(
        `Unknown metaculus question type: ${
          (apiQuestion as any).type
        }, skipping`
      );
    }
    return [];
  }
}

export const metaculus: Platform = {
  name: platformName,
  label: "Metaculus",
  color: "#006669",
  version: "v2",

  extendCliCommand(command) {
    command
      .command("fetch-one")
      .argument("<id>", "Fetch a single question by id")
      .action(async (idString) => {
        try {
          const id = Number(idString);
          const apiQuestion = await fetchSingleApiQuestion(id);
          const questions = await apiQuestionToFetchedQuestions(apiQuestion);
          console.log(questions);
          await saveQuestions(metaculus, questions, true);
        } catch (error) {
          console.log(error);
        }
      });
  },

  async fetcher() {
    let allQuestions: FetchedQuestion[] = [];

    const debug = !!process.env.DEBUG;

    let next: string | null = "https://www.metaculus.com/api2/questions/";
    let i = 1;
    while (next) {
      console.log(`\nQuery #${i} - ${next}`);

      await sleep(SLEEP_TIME);
      const apiQuestions: ApiMultipleQuestions = await fetchApiQuestions(next);
      const results = apiQuestions.results;
      // console.log(results)
      let j = false;

      for (const result of results) {
        const questions = await apiQuestionToFetchedQuestions(result);
        // console.log(questions)
        for (const question of questions) {
          console.log(`- ${question.title}`);
          if ((!j && i % 20 === 0) || debug) {
            console.log(question);
            j = true;
          }
          allQuestions.push(question);
        }
      }

      next = apiQuestions.next;
      i += 1;
    }

    return { questions: allQuestions, partial: false };
  },

  calculateStars(data) {
    let { numforecasts } = data.qualityindicators;
    numforecasts = Number(numforecasts);
    const nuno = () => (numforecasts > 300 ? 4 : numforecasts > 100 ? 3 : 2);
    const eli = () => 3;
    const misha = () => 3;
    const starsDecimal = average([nuno(), eli(), misha()]);
    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
