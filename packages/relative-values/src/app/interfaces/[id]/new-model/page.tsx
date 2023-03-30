"use client";

import { ModelPicker } from "@/components/Interface/ModelPicker";
import { NewModelForm } from "@/components/Interface/NewModelForm";

export default function NewModelPage() {
  return (
    <div className="flex flex-col gap-4 items-start">
      <ModelPicker />
      <div className="self-stretch">
        <NewModelForm />
      </div>
    </div>
  );
}
