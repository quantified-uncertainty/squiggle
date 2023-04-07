"use client";

import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ModelPicker } from "@/components/Interface/ModelPicker";
import { modelRoute } from "@/routes";
import { redirect } from "next/navigation";

export default function InterfacePage() {
  const { models, catalog } = useSelectedInterface();

  const firstModel = models.valueSeq().first();
  if (firstModel) {
    redirect(modelRoute(catalog.id, firstModel.id));
  }

  return (
    <div className="flex">
      <ModelPicker />
    </div>
  );
}
