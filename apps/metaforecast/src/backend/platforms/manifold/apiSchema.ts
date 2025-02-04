import { z } from "zod";

const numberToDate = z.number().transform((n) => {
  // Prisma can't handle large dates correctly:
  // > Could not convert argument value Object {"$type": String("DateTime"), "value": String("+010000-01-02T07:59:00.000Z")} to ArgumentValue.
  // Example with a large date: https://api.manifold.markets/v0/market/fz1K2xeIUsUtmR8SIHcE, https://manifold.markets/d6e/will-i-ever-give-you-up
  // So we reduce the value to 1e14, which is around year 5000 or so. (I'm not sure what the actual limit is.)
  return new Date(Math.min(n, 1e14));
});

// via https://docs.manifold.markets/api#get-v0markets, LiteMarket type
export const liteMarketSchema = z.object({
  // Unique identifier for this market
  id: z.string(),

  // Attributes about the creator
  creatorId: z.string(),
  creatorUsername: z.string(),
  creatorName: z.string(),
  creatorAvatarUrl: z.string().optional(),

  // Market attributes
  createdTime: numberToDate, // When the market was created
  closeTime: numberToDate.optional(), // Min of creator's chosen date, and resolutionTime
  question: z.string(),

  // Note: This url always points to https://manifold.markets, regardless of what instance the api is running on.
  // This url includes the creator's username, but this doesn't need to be correct when constructing valid URLs.
  //   i.e. https://manifold.markets/Austin/test-market is the same as https://manifold.markets/foo/test-market
  url: z.string(),

  outcomeType: z.string(), // BINARY, FREE_RESPONSE, MULTIPLE_CHOICE, NUMERIC, PSEUDO_NUMERIC, BOUNTIED_QUESTION, POLL, or ...
  mechanism: z.string(), // dpm-2, cpmm-1, or cpmm-multi-1

  probability: z.number().optional(),
  pool: z.record(z.number()).optional(), // For CPMM markets, the number of shares in the liquidity pool. For DPM markets, the amount of mana invested in each answer.
  p: z.number().optional(), // CPMM markets only, probability constant in y^p * n^(1-p) = k
  totalLiquidity: z.number().optional(), // CPMM markets only, the amount of mana deposited into the liquidity pool

  // PSEUDO_NUMERIC markets only
  value: z.number().optional(), // the current market value, which is mapped from probability using min, max, and isLogScale.
  min: z.number().optional(), // the minimum resolvable value
  max: z.number().optional(), // the maximum resolvable value
  isLogScale: z.boolean().optional(), // if true `number = (max - min + 1)^probability + minstart - 1`, otherwise `number = min + (max - min) * probability`

  volume: z.number(),
  volume24Hours: z.number(),

  isResolved: z.boolean(),
  resolutionTime: numberToDate.optional(),
  resolution: z.string().optional(),
  resolutionProbability: z.number().optional(), // Used for BINARY markets resolved to MKT
  uniqueBettorCount: z.number(),

  lastUpdatedTime: numberToDate.optional(),
  lastBetTime: numberToDate.optional(),

  token: z.enum(["MANA", "CASH"]).optional(), // mana or prizecash question
  siblingContractId: z.string().optional(), // id of the prizecash or mana version of this question that you get to by toggling.
});

export type ManifoldLiteMarket = z.infer<typeof liteMarketSchema>;

// A complete market, along with answers (for free response markets)
// Based on type FullMarket in https://docs.manifold.markets/api#get-v0marketmarketid
export const fullMarketSchema = liteMarketSchema.extend({
  // multi markets only
  answers: z
    .array(
      z.object({
        id: z.string(),
        createdTime: numberToDate,
        index: z.number(),
        text: z.string(),
        probability: z.number(),
        pool: z.record(z.number()).optional(),
      })
    )
    .optional(),
  // multi markets only, whether answers are dependant (that is add up to 100%, typically used when only one answer should win). Always true for dpm-2 multiple choice and free response
  shouldAnswersSumToOne: z.boolean().optional(),
  // multi markets only, who can add answers
  addAnswersMode: z.enum(["ANYONE", "ONLY_CREATOR", "DISABLED"]).optional(),
  // poll only
  options: z
    .array(
      z.object({
        text: z.string(),
        votes: z.number(),
      })
    )
    .optional(),
  totalBounty: z.number().optional(), // bounty only
  bountyLeft: z.number().optional(), // bounty only
  // Rich text content. See https://tiptap.dev/guide/output#option-1-json
  // Assuming JSONContent is a complex type, using z.any() for now
  description: z.any(),
  // string description without formatting, images, or embeds
  // Note: sometimes (for old markets) it's missing and `description` is a string.
  textDescription: z.string().default(""),
  coverImageUrl: z.string().nullable().optional(),
  // topics tagged in this market
  groupSlugs: z.array(z.string()).optional(),
});

export type ManifoldFullMarket = z.infer<typeof fullMarketSchema>;

/*
 * // example:
 * // https://api.manifold.markets/v0/group/covid-d7a9361d772d
 * id: "QVtAndZbd4jbfuKPSEDS",
 * slug: "covid-d7a9361d772d",
 * name: "COVID",
 * about: "",
 * creatorId: "BnrZm9NE0tgrR68qZwYoxtjKyhQ2",
 * createdTime: 1658261761000,
 * totalMembers: 350,
 * privacyStatus: "public",
 * importanceScore: 0.5520822871475163,
 */
export const groupSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  // TODO - more fields
});

export type ManifoldGroup = z.infer<typeof groupSchema>;
