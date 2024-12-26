"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { adminUpdateModelVersionAction } from "@/models/actions/adminUpdateModelVersionAction";
import { ModelFullDTO } from "@/models/data/full";

export const UpgradeButton: FC<{
  model: ModelFullDTO;
}> = ({ model }) => {
  const router = useRouter();

  if (
    model.currentRevision.contentType === "SquiggleSnippet" &&
    model.currentRevision.squiggleSnippet.version === defaultSquiggleVersion
  ) {
    return null;
  }

  return (
    <SafeActionButton
      action={adminUpdateModelVersionAction}
      input={{
        modelId: model.id,
        version: defaultSquiggleVersion,
      }}
      onSuccess={() => router.refresh()}
      theme="primary"
    >
      Upgrade to {defaultSquiggleVersion}
    </SafeActionButton>
  );
};
