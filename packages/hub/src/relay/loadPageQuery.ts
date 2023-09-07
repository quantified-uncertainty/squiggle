// based on https://github.com/relayjs/relay-examples/blob/main/issue-tracker-next-v13/src/relay/loadSerializableQuery.ts
import {
  GraphQLResponse,
  OperationType,
  RequestParameters,
  VariablesOf,
} from "relay-runtime";
import { ConcreteRequest } from "relay-runtime/lib/util/RelayConcreteNode";
import { networkFetch } from "./environment";
import { headers } from "next/headers";

export interface SerializablePreloadedQuery<TQuery extends OperationType> {
  params: RequestParameters;
  variables: VariablesOf<TQuery>;
  response: GraphQLResponse;
}

// Call into raw network fetch to get serializable GraphQL query response
// This response will be sent to the client to "warm" the QueryResponseCache
// to avoid the client fetches.
export async function loadPageQuery<TQuery extends OperationType = never>(
  node: ConcreteRequest,
  variables: VariablesOf<TQuery>
): Promise<SerializablePreloadedQuery<TQuery>> {
  const response = await networkFetch(
    node.params,
    variables,
    headers().get("cookie") ?? undefined
  );
  return {
    params: node.params,
    variables,
    response,
  };
}
