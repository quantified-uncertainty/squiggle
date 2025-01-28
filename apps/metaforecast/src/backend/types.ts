import { type Command } from "@commander-js/extra-typings";
import { Question } from "@prisma/client";

import { QuestionOption } from "@/common/types";

export type QualityIndicators = {
  stars: number;
  numforecasts?: number | string;
  numforecasters?: number;
  liquidity?: number | string;
  volume?: number;
  volume7Days?: number;
  volume24Hours?: number;
  address?: number;
  tradevolume?: string;
  pool?: any;
  createdTime?: any;
  shares_volume?: any;
  yes_bid?: any;
  yes_ask?: any;
  spread?: any;
  open_interest?: any;
  trade_volume?: any;
};

export type FetchedQuestion = Omit<
  Question,
  | "extra"
  | "qualityindicators"
  | "fetched"
  | "firstSeen"
  | "platform"
  | "options"
> & {
  extra?: object; // required in DB but annoying to return empty; also this is slightly stricter than Prisma's JsonValue
  options: QuestionOption[]; // stronger type than Prisma's JsonValue
  qualityindicators: Omit<QualityIndicators, "stars">; // slightly stronger type than Prisma's JsonValue
};

// fetcher should return null if platform failed to fetch questions for some reason
type PlatformFetcherV1 = () => Promise<FetchedQuestion[] | null>;

type PlatformFetcherV2Result = {
  questions: FetchedQuestion[];
  // if partial is true then we won't cleanup old questions from the database; this is useful when manually invoking a fetcher with arguments for updating a single question
  partial: boolean;
} | null;
type PlatformFetcherV2 = () => Promise<PlatformFetcherV2Result>;

// using "" as ArgNames default is technically incorrect, but shouldn't cause any real issues
// (I couldn't find a better solution for signifying an empty value, though there probably is one)
export type Platform = {
  name: string; // short name for ids and `platform` db column, e.g. "xrisk"
  label: string; // longer name for displaying on frontend etc., e.g. "X-risk estimates"
  color: string; // used on frontend
  calculateStars: (question: FetchedQuestion) => number;
  // extended commander configuration, e.g. subcommands
  extendCliCommand?: (command: Command) => void;
} & (
  | {
      version: "v1";
      fetcher: PlatformFetcherV1;
    }
  | {
      version: "v2";
      fetcher?: PlatformFetcherV2;
    }
);

export type PlatformConfig = {
  name: string;
  label: string;
  color: string;
};
