// Convert preloaded query object (with raw GraphQL Response) into Relay's PreloadedQuery.

import { useMemo } from "react";
import {
  PreloadedQuery,
  PreloadFetchPolicy,
  useRelayEnvironment,
} from "react-relay";
import { ConcreteRequest, OperationType } from "relay-runtime";

import { SerializablePreloadedQuery } from "./loadSerializableQuery";
import { EnvironmentWithResponseCache } from "./environment";

// This hook convert serializable preloaded query into Relay's PreloadedQuery object.
// It also writes this serializable preloaded query into QueryResponseCache, so that
// the network layer can use these cache results when fetching data in `usePreloadedQuery`.
export function useSerializablePreloadedQuery<
  TRequest extends ConcreteRequest,
  TQuery extends OperationType
>(
  preloadQuery: SerializablePreloadedQuery<TRequest, TQuery>,
  fetchPolicy: PreloadFetchPolicy = "store-or-network"
): PreloadedQuery<TQuery> {
  const environment = useRelayEnvironment();
  useMemo(() => {
    writePreloadedQueryToCache(
      preloadQuery,
      environment as EnvironmentWithResponseCache
    );
  }, [preloadQuery, environment]);

  return {
    environment,
    fetchKey: preloadQuery.params.id ?? preloadQuery.params.cacheID,
    fetchPolicy,
    isDisposed: false,
    name: preloadQuery.params.name,
    kind: "PreloadedQuery",
    variables: preloadQuery.variables,
    dispose: () => {
      return;
    },
  };
}

function writePreloadedQueryToCache<
  TRequest extends ConcreteRequest,
  TQuery extends OperationType
>(
  preloadedQueryObject: SerializablePreloadedQuery<TRequest, TQuery>,
  environment: EnvironmentWithResponseCache
) {
  const cacheKey =
    preloadedQueryObject.params.id ?? preloadedQueryObject.params.cacheID;

  environment.responseCache?.set(
    cacheKey,
    preloadedQueryObject.variables,
    preloadedQueryObject.response
  );
}
