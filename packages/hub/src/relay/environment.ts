// based on https://github.com/relayjs/relay-examples/blob/main/issue-tracker-next-v13/src/relay/environment.ts
import {
  Environment,
  Network,
  RecordSource,
  Store,
  RequestParameters,
  Variables,
  GraphQLResponse,
  CacheConfig,
  EnvironmentConfig,
} from "relay-runtime";

import { PatchedQueryResponseCache } from "./PatchedQueryResponseCache";

const IS_SERVER = typeof window === typeof undefined;

const HTTP_ENDPOINT = IS_SERVER
  ? process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/graphql`
    : "http://localhost:3001/api/graphql"
  : "/api/graphql";

const CACHE_TTL = 5 * 1000; // 5 seconds, to resolve preloaded results

export async function networkFetch(
  request: RequestParameters,
  variables: Variables,
  cookieHeader?: string
): Promise<GraphQLResponse> {
  const resp = await fetch(HTTP_ENDPOINT, {
    cache: "no-store",
    method: "POST",
    headers: {
      Cookie: cookieHeader ?? "",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: request.text,
      variables,
    }),
  });
  const json = await resp.json();

  // GraphQL returns exceptions (for example, a missing required variable) in the "errors"
  // property of the response. If any exceptions occurred when processing the request,
  // throw an error to indicate to the developer what went wrong.
  if (Array.isArray(json.errors)) {
    console.error(json.errors);
    throw new Error(
      `Error fetching GraphQL query '${
        request.name
      }' with variables '${JSON.stringify(variables)}': ${JSON.stringify(
        json.errors
      )}`
    );
  }

  return json;
}

export function createNetwork(responseCache: PatchedQueryResponseCache) {
  const fetchResponse = async (
    params: RequestParameters,
    variables: Variables,
    cacheConfig: CacheConfig
  ): Promise<GraphQLResponse> => {
    const isQuery = params.operationKind === "query";
    const cacheKey = params.id ?? params.cacheID;
    if (isQuery && !cacheConfig.force) {
      const fromCache = responseCache.get(cacheKey, variables);
      if (fromCache) {
        return fromCache;
      }
    }

    // TODO - on server, it might be better to run GraphQL query directly, instead of going through yoga and HTTP
    return await networkFetch(params, variables);
  };

  return Network.create(fetchResponse);
}

export class EnvironmentWithResponseCache extends Environment {
  constructor(
    config: EnvironmentConfig,
    public responseCache: PatchedQueryResponseCache
  ) {
    super(config);
  }
}

function createEnvironment() {
  // We have response cache even on server; isolation is guaranteed by `getCurrentEnvironment()` logic.
  // We expose it as `environment.responseCache` so that `useSerializablePreloadedQuery` could access it.
  const responseCache = new PatchedQueryResponseCache({
    size: 100,
    ttl: CACHE_TTL,
  });
  return new EnvironmentWithResponseCache(
    {
      network: createNetwork(responseCache),
      store: new Store(RecordSource.create()),
      isServer: IS_SERVER,
    },
    responseCache
  );
}

let environment: EnvironmentWithResponseCache | undefined;
export function getCurrentEnvironment() {
  if (IS_SERVER) {
    return createEnvironment();
  }

  environment ??= createEnvironment();
  return environment;
}
