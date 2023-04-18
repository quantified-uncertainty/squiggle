import { NextResponse } from "next/server";

// Proxy for exchanging github code to access token.
// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
const accessTokenEndpoint = "https://github.com/login/oauth/access_token";

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

export async function POST(request: Request) {
  const { code } = await request.json();
  if (typeof code !== "string") {
    return NextResponse.json({
      error: "`code` not set or has an unknown type",
    });
  }

  const res = await fetch(accessTokenEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const responseJSON = await res.json();

  return NextResponse.json(responseJSON);
}
