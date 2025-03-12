import { NextRequest, NextResponse } from "next/server";

import { getAllEvaluators } from "@/evals/data/evaluators";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    const evaluators = await getAllEvaluators();
    
    // Filter evaluators by name if search term is provided
    const filtered = search
      ? evaluators.filter((evaluator) =>
          evaluator.name.toLowerCase().includes(search.toLowerCase())
        )
      : evaluators;

    // Map to the simple format needed by the select component
    const result = filtered.map((evaluator) => ({
      id: evaluator.id,
      name: evaluator.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching evaluators:", error);
    return NextResponse.json({ error: "Failed to fetch evaluators" }, { status: 500 });
  }
}