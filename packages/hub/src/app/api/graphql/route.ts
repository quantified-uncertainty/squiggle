import { createYoga } from "graphql-yoga";
import { schema } from "@/graphql/schema";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const yoga = createYoga({
  graphqlEndpoint: "/api/graphql",
  schema,
  context: async () => {
    // There's some magic involved here;
    // getServerSession() obtains request data through Next.js cookies() and headers() functions
    // See also: https://github.com/nextauthjs/next-auth/issues/7355
    const session = await getServerSession(authOptions);
    return { session };
  },
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
