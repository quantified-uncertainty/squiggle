import { z } from "zod";

// https://docs.polymarket.com/#gamma-markets-api
const gammaEndpoint = "https://gamma-api.polymarket.com";

export async function* fetchAllOpenMarkets() {
  let offset = 0;
  const limit = 500;

  const seen = new Set<string>();

  while (true) {
    const url = `${gammaEndpoint}/markets?offset=${offset}&limit=${limit}&closed=false`;
    console.log(`Fetching markets: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const listItems = z.array(z.unknown()).parse(data);
    for (let i = 0; i < listItems.length; i++) {
      const parsedMarket = marketSchema.safeParse(listItems[i]);
      if (parsedMarket.success) {
        const market = parsedMarket.data;
        if (seen.has(market.id)) {
          continue;
        }
        yield market;
        seen.add(market.id);
      } else {
        const error = parsedMarket.error;
        console.error(
          `Error parsing market[${i}]: ${error.issues.length} issues. First issue:\n${JSON.stringify(error.issues[0], null, 2)}`
        );
      }
    }
    if (listItems.length < limit) {
      break;
    }

    // TODO - add some overlap with deduplication, so that we don't miss any new markets
    offset += limit;
  }
}

const outcomeSchema = z.array(z.string());

const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  slug: z.string(),
  description: z.string(),
  outcomes: z.string().transform((s) => {
    const parsed = JSON.parse(s);
    return outcomeSchema.parse(parsed);
  }),
  outcomePrices: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      const parsed = JSON.parse(s);
      return outcomeSchema.parse(parsed);
    }),
  // this can be empty on newer markets, and I'm not sure how useful it is
  // note that this field is not always unique across markets, even if they don't belong to the same event.
  // Example:
  // - https://gamma-api.polymarket.com/markets?slug=nhl-pit-phi-2025-02-25
  // - https://gamma-api.polymarket.com/markets?slug=cbb-app-gaso-2025-02-25
  marketMakerAddress: z.string(),
  category: z.string().optional(),
  volumeNum: z.number().optional(),
  liquidityNum: z.number().optional(),
});

// TODO:
// startDate
// endDate
// category
// liquidity
// volumeNum
// liquidityNum
// volume24hr
// active
// closed
