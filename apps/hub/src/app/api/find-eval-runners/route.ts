import { NextRequest, NextResponse } from "next/server";

import { getAllEvalRunners } from "@/evals/data/evalRunners";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    const evalRunners = await getAllEvalRunners();

    // Filter eval runners by name if search term is provided
    const filtered = search
      ? evalRunners.filter((runner) =>
          runner.name.toLowerCase().includes(search.toLowerCase())
        )
      : evalRunners;

    // Map to the simple format needed by the select component
    const result = filtered.map((runner) => ({
      id: runner.id,
      name: runner.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching eval runners:", error);
    return NextResponse.json(
      { error: "Failed to fetch eval runners" },
      { status: 500 }
    );
  }
}
