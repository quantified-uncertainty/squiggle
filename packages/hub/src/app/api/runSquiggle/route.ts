import { runSquiggle } from "@/graphql/queries/runSquiggle";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Assuming 'code' is sent in the request body and is a string
  const body = await req.json();
  if (body.code) {
    let response = await runSquiggle(body.code);
    if (response.isOk) {
      return new NextResponse(
        JSON.stringify({
          result: response.resultJSON,
          bindings: response.bindingsJSON,
        }),
        {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new NextResponse(JSON.stringify({ error: response.errorString }), {
        status: 400,
        statusText: "ERROR",
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    return new NextResponse(JSON.stringify({ error: "No code provided" }), {
      status: 400,
      statusText: "ERROR",
      headers: { "Content-Type": "application/json" },
    });
  }
}
