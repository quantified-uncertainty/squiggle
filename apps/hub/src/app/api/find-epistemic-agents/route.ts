import { NextRequest, NextResponse } from "next/server";

import { getAllEpistemicAgents } from "@/evals/data/epistemicAgents";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    const epistemicAgents = await getAllEpistemicAgents();

    // Filter epistemic agents by name if search term is provided
    const filtered = search
      ? epistemicAgents.filter((agent) =>
          agent.name.toLowerCase().includes(search.toLowerCase())
        )
      : epistemicAgents;

    // Map to the simple format needed by the select component
    const result = filtered.map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching epistemic agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch epistemic agents" },
      { status: 500 }
    );
  }
}
