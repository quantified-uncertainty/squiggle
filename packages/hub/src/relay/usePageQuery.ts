// Convert preloaded query object (with raw GraphQL Response) into Relay's PreloadedQuery.

import { useEffect, useMemo } from "react";
import {
  PreloadedQuery,
  usePreloadedQuery,
  useQueryLoader,
  useRelayEnvironment,
} from "react-relay";
import {
  ConcreteRequest,
  GraphQLTaggedNode,
  OperationType,
} from "relay-runtime";

import { EnvironmentWithResponseCache } from "./environment";
import { SerializablePreloadedQuery } from "./loadSerializableQuery";

// This hook convert serializable preloaded query into Relay's PreloadedQuery object.
// It also writes this serializable preloaded query into QueryResponseCache, so that
// the network layer can use these cache results when fetching data in `usePreloadedQuery`.
//
// In addition to the basic implementation from https://github.com/relayjs/relay-examples/tree/main/issue-tracker-next-v13, this hook:
// - combines `useSerializablePreloadedQuery` and `usePreloadedQuery` into one call
// - returns a `reload()` function that can be used together with `useSubscribeToInvalidationState` to reload page data.
export function usePageQuery<
  TRequest extends ConcreteRequest,
  TQuery extends OperationType
>(
  rscQuery: SerializablePreloadedQuery<TRequest, TQuery>,
  Query: GraphQLTaggedNode
) {
  const environment = useRelayEnvironment() as EnvironmentWithResponseCache;

  const [initialQueryRef, fetchKey] = useMemo(() => {
    const fetchKey = rscQuery.params.id ?? rscQuery.params.cacheID;

    environment.responseCache.set(
      fetchKey,
      rscQuery.variables,
      rscQuery.response
    );

    const preloadedQuery = {
      environment,
      fetchKey,
      // On the first page load, it will hit responseCache.
      // On the following loads (on client-side navigation), responseCache will be cleaned up when the component is unmounted,
      // and the page data will be reloaded.
      // Note: in dev, this will cause /api/graphql refetch on the client side, because of React strict mode. But it shouldn't do that in production.
      fetchPolicy: "store-and-network",
      isDisposed: false,
      name: rscQuery.params.name,
      kind: "PreloadedQuery",
      variables: rscQuery.variables,
      dispose: () => {},
    } as PreloadedQuery<TQuery>;

    return [preloadedQuery, fetchKey];
  }, [rscQuery, environment]);

  useEffect(() => {
    return () => {
      environment.responseCache.delete(fetchKey, rscQuery.variables);
    };
  }, [fetchKey, environment, initialQueryRef, rscQuery.variables]);

  const [queryRef, loadQuery] = useQueryLoader<TQuery>(Query);
  const result = usePreloadedQuery(Query, queryRef ?? initialQueryRef);

  const reload = () => loadQuery(rscQuery.variables);

  useEffect(() => {
    return () => {
      initialQueryRef.dispose();
    };
  }, [initialQueryRef]);

  return [result, { reload }] as const;
}
