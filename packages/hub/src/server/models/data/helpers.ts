import { controlsOwnerId } from "@/server/owners/auth";

import { ModelCardDTO } from "./card";

export async function isModelEditable(model: ModelCardDTO): Promise<boolean> {
  return controlsOwnerId(model.owner.id);
}
