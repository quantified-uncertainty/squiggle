import { NextRequest, NextResponse } from "next/server";

import { getEvaluationsByQuestionSetId } from "@/evals/data/summaryEvals";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const questionSetId = searchParams.get("questionSetId");

  if (!questionSetId) {
    return NextResponse.json(
      { error: "Question set ID is required" },
      { status: 400 }
    );
  }

  try {
    const evaluations = await getEvaluationsByQuestionSetId(questionSetId);

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}
