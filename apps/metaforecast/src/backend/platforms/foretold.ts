/* Imports */
import axios from "axios";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";

/* Definitions */

const platformName = "foretold";

let graphQLendpoint = "https://api.foretold.io/graphql";
let highQualityCommunities = [
  "0104d8e8-07e4-464b-8b32-74ef22b49f21",
  "c47c6bc8-2c9b-4a83-9583-d1ed80a40fa2",
  "cf663021-f87f-4632-ad82-962d889a2d39",
  "47ff5c49-9c20-4f3d-bd57-1897c35cd42d",
  "b2412a1d-0aa4-4e37-a12a-0aca9e440a96",
];

/* Support functions */
async function fetchAllCommunityQuestions(communityId: string) {
  // TODO - fetch foretold graphql schema to type the result properly?
  // (should be doable with graphql-code-generator, why not)
  const response = await axios({
    url: graphQLendpoint,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      query: `
      query {
        measurables(
          channelId: "${communityId}",
          states: OPEN,
          first: 500
        ) {
          total
          edges {
            node {
              id
              name
              valueType
              measurementCount
              previousAggregate{
                value{
                  percentage
                }
              }
            }
          }
        }
      }
      `,
    }),
  })
    .then((res) => res.data)
    .then((res) => res.data.measurables.edges);

  return response as any[];
}

export const foretold: Platform = {
  name: platformName,
  label: "Foretold",
  color: "#62520b",
  version: "v1",
  async fetcher() {
    let results: FetchedQuestion[] = [];
    for (let community of highQualityCommunities) {
      let questions = await fetchAllCommunityQuestions(community);
      questions = questions.map((question) => question.node);
      questions = questions.filter((question) => question.previousAggregate); // Questions without any predictions
      questions.forEach((question) => {
        const id = `${platformName}-${question.id}`;

        let options: FetchedQuestion["options"] = [];
        if (question.valueType == "PERCENTAGE") {
          const probability = question.previousAggregate.value.percentage;
          options = [
            {
              name: "Yes",
              probability: probability / 100,
              type: "PROBABILITY",
            },
            {
              name: "No",
              probability: 1 - probability / 100,
              type: "PROBABILITY",
            },
          ];
        }

        const result: FetchedQuestion = {
          id,
          title: question.name,
          url: `https://www.foretold.io/c/${community}/m/${question.id}`,
          description: "",
          options,
          qualityindicators: {
            numforecasts: Math.floor(Number(question.measurementCount) / 2),
          },
          /*liquidity: liquidity.toFixed(2),
          tradevolume: tradevolume.toFixed(2),
          address: obj.address*/
        };
        // console.log(result)
        results.push(result);
      });
    }
    return results;
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
