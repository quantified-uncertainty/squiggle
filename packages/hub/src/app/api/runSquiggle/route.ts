import { NextRequest, NextResponse } from "next/server";

import { runSquiggle } from "@/graphql/queries/runSquiggle";

export async function POST(req: NextRequest) {
  // Assuming 'code' is sent in the request body and is a string
  try {
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
        return new NextResponse(
          JSON.stringify({ error: response.errorString }),
          {
            status: 400,
            statusText: "ERROR",
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      return new NextResponse(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        statusText: "ERROR",
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // Catch any errors, including JSON parsing errors
    console.error("Error in POST request:", error);
    return new NextResponse(
      //We could give more information here, but we don't want to leak any information
      JSON.stringify({ error: "An internal error occurred" }),
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
