"use server";
import { loadModelCard, ModelCardData } from "./data";

// used in ImportTooltip
export async function loadModelCardAction({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<ModelCardData | null> {
  return loadModelCard({ owner, slug });
}
