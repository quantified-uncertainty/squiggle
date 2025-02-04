import { addDays, startOfDay, startOfToday, startOfTomorrow } from "date-fns";

import { isFullQuestionOption } from "../../../../common/types";
import { QuestionWithHistoryFragment } from "../../../fragments.generated";
import { isQuestionBinary } from "../../../utils";

export type ChartSeries = { x: Date; y: number; name: string }[];

export const MAX_LINES = 5;

// number of colors should match MAX_LINES
// colors are taken from tailwind, https://tailwindcss.com/docs/customizing-colors
export const chartColors = [
  "#0284C7", // sky-600
  "#DC2626", // red-600
  "#15803D", // green-700
  "#7E22CE", // purple-700
  "#F59E0B", // amber-500
];

export const goldenRatio = (1 + Math.sqrt(5)) / 2;
// used both for chart and for ssr placeholder
export const width = 750;
export const height = width / goldenRatio;

export type ChartData = {
  seriesList: ChartSeries[];
  seriesNames: string[];
  maxProbability: number;
  minDate: Date;
  maxDate: Date;
};

export const buildChartData = (
  question: QuestionWithHistoryFragment
): ChartData => {
  let seriesNames = question.options
    .filter(isFullQuestionOption)
    .sort((a, b) => {
      if (a.probability > b.probability) {
        return -1;
      } else if (a.probability < b.probability) {
        return 1;
      }
      return a.name < b.name ? -1 : 1; // needed for stable sorting - otherwise it's possible to get order mismatch in SSR vs client-side
    })
    .map((o) => o.name)
    .slice(0, MAX_LINES);

  const isBinary = isQuestionBinary(question);
  if (isBinary) {
    seriesNames = ["Yes"];
  }

  const nameToIndex = Object.fromEntries(
    seriesNames.map((name, i) => [name, i])
  );
  let seriesList: ChartSeries[] = [...Array(seriesNames.length)].map((x) => []);

  const sortedHistory = question.history.sort((a, b) =>
    a.fetched < b.fetched ? -1 : 1
  );

  {
    let previousDate = -Infinity;
    for (const item of sortedHistory) {
      if (item.fetched - previousDate < 12 * 60 * 60) {
        continue;
      }
      const date = new Date(item.fetched * 1000);

      for (const option of item.options) {
        if (option.name == null || option.probability == null) {
          continue;
        }
        const idx = nameToIndex[option.name];
        if (idx === undefined) {
          continue;
        }
        const result = {
          x: date,
          y: option.probability,
          name: option.name,
        };
        seriesList[idx].push(result);
      }
      previousDate = item.fetched;
    }
  }

  let maxProbability = 0;
  for (const dataSet of seriesList) {
    for (const item of dataSet) {
      maxProbability = Math.max(maxProbability, item.y);
    }
  }

  const minDate = sortedHistory.length
    ? startOfDay(new Date(sortedHistory[0].fetched * 1000))
    : startOfToday();
  const maxDate = sortedHistory.length
    ? addDays(
        startOfDay(
          new Date(sortedHistory[sortedHistory.length - 1].fetched * 1000)
        ),
        1
      )
    : startOfTomorrow();

  return {
    seriesList,
    seriesNames,
    maxProbability,
    minDate,
    maxDate,
  };
};
