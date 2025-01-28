// apollo-server-micro is problematic since v3, see https://github.com/apollographql/apollo-server/issues/5547, so we use graphql-yoga instead
import { createYoga } from "graphql-yoga";
import { NextRequest, NextResponse } from "next/server";

import { useResponseCache } from "@graphql-yoga/plugin-response-cache";

import { schema } from "../../../graphql/schema";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  plugins: [
    useResponseCache({
      // global cache
      session: () => null,
      ttl: 2 * 60 * 60 * 1000,
      // ^ 2h * 60 mins per hour, 60 seconds per min 1000 miliseconds per second
    }),
  ],
});

async function handler(request: NextRequest) {
  const response = await yoga.fetch(request, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  return new NextResponse(response.body, {
    headers: response.headers,
    status: response.status,
  });
}

export { handler as GET, handler as POST };
