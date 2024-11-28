"use server";
import { loadModelCard, ModelCardDTO } from "../data/card";

// data-fetching action, used in ImportTooltip
export async function loadModelCardAction({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<ModelCardDTO | null> {
  return loadModelCard({ owner, slug });
}
