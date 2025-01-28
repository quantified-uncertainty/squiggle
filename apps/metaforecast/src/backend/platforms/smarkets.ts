import axios from "axios";

import { QuestionOption } from "../../common/types";
import { average } from "../../utils";
import { saveQuestions } from "../robot";
import { FetchedQuestion, Platform } from "../types";

/* Definitions */
const platformName = "smarkets";
const apiEndpoint = "https://api.smarkets.com/v3"; // documented at https://docs.smarkets.com/

type Context = {
  verbose: boolean;
};

/* Support functions */

async function fetchEvents(ctx: Context) {
  let queryString =
    "?state=new&state=upcoming&state=live&type_domain=politics&type_scope=single_event&with_new_type=true&sort=id&limit=50";

  let events = [];
  while (queryString) {
    const data = await axios({
      url: `${apiEndpoint}/events/${queryString}`,
      method: "GET",
    }).then((res) => res.data);

    events.push(...data.events);
    queryString = data.pagination.next_page;
  }
  ctx.verbose && console.log(events);

  return events;
}

async function fetchSingleEvent(id: string, ctx: Context) {
  const events = await fetchEvents(ctx);
  const event = events.find((event) => event.id === id);
  if (!event) {
    throw new Error(`Event ${id} not found`);
  }
  return event;
}

async function fetchMarkets(eventId: string) {
  const response = await axios({
    url: `${apiEndpoint}/events/${eventId}/markets/`,
    method: "GET",
  })
    .then((res) => res.data)
    .then((res) => res.markets);
  return response;
}

async function fetchContracts(marketId: string, ctx: Context) {
  const response = await axios({
    url: `${apiEndpoint}/markets/${marketId}/contracts/?include_hidden=true`,
    method: "GET",
  }).then((res) => res.data);
  ctx.verbose && console.log(response);

  if (!(response.contracts instanceof Array)) {
    throw new Error("Invalid response while fetching contracts");
  }
  return response.contracts as any[];
}

async function fetchPrices(marketId: string, ctx: Context) {
  const response = await axios({
    url: `https://api.smarkets.com/v3/markets/${marketId}/last_executed_prices/`,
    method: "GET",
  }).then((res) => res.data);
  ctx.verbose && console.log(response);
  if (!response.last_executed_prices) {
    throw new Error("Invalid response while fetching prices");
  }
  return response.last_executed_prices;
}

async function processEventMarkets(event: any, ctx: Context) {
  ctx.verbose && console.log(Date.now());
  ctx.verbose && console.log(event.name);

  let markets = await fetchMarkets(event.id);
  markets = markets.map((market: any) => ({
    ...market,
    // smarkets doesn't have separate urls for different markets in a single event
    // we could use anchors (e.g. https://smarkets.com/event/886716/politics/uk/uk-party-leaders/next-conservative-leader#contract-collapse-9815728-control), but it's unclear if they aren't going to change
    slug: event.full_slug,
  }));
  ctx.verbose && console.log(`Markets for ${event.id} fetched`);
  ctx.verbose && console.log(markets);

  let results: FetchedQuestion[] = [];
  for (const market of markets) {
    ctx.verbose && console.log("================");
    ctx.verbose && console.log("Market:", market);

    const contracts = await fetchContracts(market.id, ctx);
    ctx.verbose && console.log("Contracts:", contracts);
    const prices = await fetchPrices(market.id, ctx);
    ctx.verbose && console.log("Prices:", prices[market.id]);

    let optionsObj: {
      [k: string]: QuestionOption;
    } = {};

    const contractsById = Object.fromEntries(
      contracts.map((c) => [c.id as string, c])
    );

    for (const price of prices[market.id]) {
      const contract = contractsById[price.contract_id];
      if (!contract) {
        console.warn(
          `Couldn't find contract ${price.contract_id} in contracts data for ${market.id}, event ${market.event_id}, skipping`
        );
        continue;
      }
      optionsObj[price.contract_id] = {
        name: contract.name,
        probability: contract.hidden ? 0 : Number(price.last_executed_price),
        type: "PROBABILITY",
      };
    }
    let options: QuestionOption[] = Object.values(optionsObj);
    ctx.verbose && console.log("Options before patching:", options);

    // monkey patch the case where there are only two options and only one has traded.
    if (
      options.length === 2 &&
      options.map((option) => option.probability).includes(0)
    ) {
      const nonNullPrice = options[0].probability || options[1].probability;

      if (nonNullPrice) {
        options = options.map((option) => {
          return {
            ...option,
            probability: option.probability || 100 - nonNullPrice,
            // yes, 100, because prices are not yet normalized.
          };
        });
      }
    }
    ctx.verbose && console.log("Options after patching:", options);

    // Normalize normally
    const totalValue = options
      .map((element) => Number(element.probability))
      .reduce((a, b) => a + b, 0);

    options = options.map((element) => ({
      ...element,
      probability: Number(element.probability) / totalValue,
    }));
    ctx.verbose && console.log("Normalized options:", options);

    const result: FetchedQuestion = {
      id: `${platformName}-${market.id}`,
      title: market.name,
      url: "https://smarkets.com/event/" + market.event_id + market.slug,
      description: market.description,
      options,
      qualityindicators: {},
      extra: {
        contracts,
        prices,
      },
    };
    ctx.verbose && console.log(result);
    results.push(result);
  }
  return results;
}

export const smarkets: Platform = {
  name: platformName,
  label: "Smarkets",
  color: "#6f5b41",
  version: "v2",

  extendCliCommand(command) {
    command
      .command("fetch-one")
      .argument("<id>", "Fetch a single question by id")
      .action(async (eventId) => {
        const events = [
          await fetchSingleEvent(eventId, {
            verbose: !!process.env.DEBUG,
          }),
        ];
        await saveQuestions(smarkets, events, true);
      });
  },

  async fetcher() {
    const ctx = {
      verbose: !!process.env.DEBUG,
    };

    const partial = false;
    const events = await fetchEvents(ctx);

    let results: FetchedQuestion[] = [];
    for (const event of events) {
      const eventResults = await processEventMarkets(event, ctx);
      results.push(...eventResults);
    }

    return {
      questions: results,
      partial,
    };
  },
  calculateStars(data) {
    const nuno = () => 2;
    const eli = () => null;
    const misha = () => null;
    const starsDecimal = average([nuno()]); //, eli(), misha()])
    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
