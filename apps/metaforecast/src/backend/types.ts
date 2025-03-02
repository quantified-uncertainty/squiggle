import { type Command } from "@commander-js/extra-typings";
import { z } from "zod";

import { Question } from "@quri/metaforecast-db";

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
  pool?: Record<string, number>;
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
type PlatformFetcherResult = {
  questions: FetchedQuestion[];
} | null;
type PlatformFetcher = () => Promise<PlatformFetcherResult>;

// using "" as ArgNames default is technically incorrect, but shouldn't cause any real issues
// (I couldn't find a better solution for signifying an empty value, though there probably is one)
export type Platform<TState extends z.ZodTypeAny = any> = {
  name: string; // short name for ids and `platform` db column, e.g. "xrisk"
  label: string; // longer name for displaying on frontend etc., e.g. "X-risk estimates"
  color: string; // used on frontend
  calculateStars: (question: FetchedQuestion) => number;
  // extended commander configuration, e.g. subcommands
  extendCliCommand?: (command: Command) => void;

  // fetchers are optional
  fetcher?: PlatformFetcher;

  stateSchema?: TState;
};

export type PlatformConfig = {
  name: string;
  label: string;
  color: string;
};
