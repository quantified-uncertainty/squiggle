import { createYoga } from "graphql-yoga";
import { schema } from "@/graphql/schema";
import { NextResponse } from "next/server";

const yoga = createYoga({
  graphqlEndpoint: "/",
  schema,
});

export async function GET(request: Request) {
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

export const POST = GET;
