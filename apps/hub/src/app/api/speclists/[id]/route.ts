import { NextRequest } from "next/server";
import { getSpecListById } from "@quri/evals";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const specList = await getSpecListById(params.id);
    
    return Response.json({
      id: specList.id,
      name: specList.name,
      specsCount: specList.specs.length,
    });
  } catch (error) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}