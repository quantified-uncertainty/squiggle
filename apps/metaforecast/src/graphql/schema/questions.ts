import { History, Question } from "@prisma/client";

import { QualityIndicators } from "@/backend/types";

import { prisma } from "../../backend/database/prisma";
import { guesstimate } from "../../backend/platforms/guesstimate";
import { builder } from "../builder";
import { PlatformObj } from "./platforms";

export const QualityIndicatorsObj = builder
  .objectRef<QualityIndicators>("QualityIndicators")
  .implement({
    description: "Various indicators of the question's quality",
    fields: (t) => {
      const maybeIntField = (name: keyof QualityIndicators) =>
        t.int({
          nullable: true,
          resolve: (parent) =>
            parent[name] === undefined ? undefined : Number(parent[name]),
        });
      const maybeFloatField = (name: keyof QualityIndicators) =>
        t.float({
          nullable: true,
          resolve: (parent) =>
            parent[name] === undefined ? undefined : Number(parent[name]),
        });

      return {
        stars: t.exposeInt("stars", {
          description: "0 to 5",
        }),
        numForecasts: maybeIntField("numforecasts"),
        numForecasters: maybeIntField("numforecasters"),
        volume: maybeFloatField("volume"),
        // yesBid: maybeNumberField("yes_bid"),
        // yesAsk: maybeNumberField("yes_ask"),
        spread: maybeFloatField("spread"),
        sharesVolume: maybeFloatField("shares_volume"),
        openInterest: maybeFloatField("open_interest"),
        liquidity: maybeFloatField("liquidity"),
        tradeVolume: maybeFloatField("trade_volume"),
      };
    },
  });

export const ProbabilityOptionObj = builder
  .objectRef<{ name: string; probability: number }>("ProbabilityOption")
  .implement({
    fields: (t) => ({
      name: t.exposeString("name", { nullable: true }),
      probability: t.exposeFloat("probability", {
        description: "0 to 1",
        nullable: true,
      }),
    }),
  });

const QuestionShapeInterface = builder
  .interfaceRef<Question | History>("QuestionShape")
  .implement({
    fields: (t) => ({
      title: t.exposeString("title"),
      description: t.exposeString("description"),
      url: t.exposeString("url", {
        description:
          "Non-unique, a very small number of platforms have a page for more than one prediction",
      }),
      platform: t.field({
        type: PlatformObj,
        resolve: (parent) => parent.platform,
      }),
      timestamp: t.field({
        type: "Date",
        description:
          "Last timestamp at which metaforecast fetched the question",
        deprecationReason: "Renamed to `fetched`",
        resolve: (parent) => parent.fetched,
      }),
      fetched: t.field({
        type: "Date",
        description:
          "Last timestamp at which metaforecast fetched the question",
        resolve: (parent) => parent.fetched,
      }),
      fetchedStr: t.string({
        description:
          "Last timestamp at which metaforecast fetched the question, in ISO 8601 format",
        resolve: (parent) => parent.fetched.toISOString(),
      }),
      qualityIndicators: t.field({
        type: QualityIndicatorsObj,
        resolve: (parent) =>
          parent.qualityindicators as any as QualityIndicators,
      }),
      options: t.field({
        type: [ProbabilityOptionObj],
        resolve: ({ options }) => {
          if (!Array.isArray(options)) {
            return [];
          }
          return options as any[];
        },
      }),
    }),
  });

export const HistoryObj = builder.prismaObject("History", {
  findUnique: (history) => ({ pk: history.pk }),
  interfaces: [QuestionShapeInterface],
  fields: (t) => ({
    id: t.exposeID("pk", {
      description: "History items are identified by their integer ids",
    }),
    questionId: t.exposeID("id", {
      description: "Unique string which identifies the question",
    }),
  }),
});

export const QuestionObj = builder.prismaObject("Question", {
  findUnique: (question) => ({ id: question.id }),
  interfaces: [QuestionShapeInterface],
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique string which identifies the question",
    }),
    visualization: t.string({
      resolve: (parent) => (parent.extra as any)?.visualization, // used for guesstimate only, see searchGuesstimate.ts
      nullable: true,
    }),
    firstSeen: t.field({
      type: "Date",
      description: "First timestamp at which metaforecast fetched the question",
      resolve: (parent) => parent.firstSeen,
    }),
    firstSeenStr: t.string({
      description:
        "First timestamp at which metaforecast fetched the question, in ISO 8601 format",
      resolve: (parent) => parent.firstSeen.toISOString(),
    }),
    history: t.relation("history", {
      query: () => ({
        orderBy: {
          fetched: "asc",
        },
      }),
    }),
  }),
});

builder.queryField("questions", (t) =>
  t.prismaConnection(
    {
      type: "Question",
      cursor: "id",
      maxSize: 1000,
      args: {
        orderBy: t.arg({
          type: builder.enumType("QuestionsOrderBy", {
            values: ["FIRST_SEEN_DESC"] as const,
          }),
        }),
      },
      resolve: (query, parent, args) => {
        return prisma.question.findMany({
          ...query,
          ...(args.orderBy === "FIRST_SEEN_DESC"
            ? { orderBy: [{ firstSeen: "desc" }, { id: "asc" }] }
            : {}), // TODO - explicit default order?
        });
      },
    },
    {},
    {}
  )
);

builder.queryField("question", (t) =>
  t.field({
    type: QuestionObj,
    nullable: true,
    description: "Look up a single question by its id",
    args: {
      id: t.arg({ type: "ID", required: true }),
    },
    resolve: async (parent, args) => {
      const parts = String(args.id).split("-");
      const [platform, id] = [parts[0], parts.slice(1).join("-")];
      if (platform === "guesstimate") {
        const q = await guesstimate.fetchQuestion(Number(id));
        return q;
      }
      return await prisma.question.findUnique({
        where: {
          id: String(args.id),
        },
      });
    },
  })
);
