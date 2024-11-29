import { controlsOwnerId } from "@/server/owners/auth";

import { ModelCardDTO } from "./cards";

export async function isModelEditable(model: ModelCardDTO): Promise<boolean> {
  return controlsOwnerId(model.owner.id);
}
