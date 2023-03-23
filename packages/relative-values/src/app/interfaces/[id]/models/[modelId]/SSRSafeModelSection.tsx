import dynamic from "next/dynamic";
import { FC } from "react";

const ModelSection =
  typeof window === "undefined"
    ? null
    : dynamic(() =>
        import("@/components/Interface/ModelSection").then(
          (mod) => mod.ModelSection
        )
      );

export const SSRSafeModelSection: FC = () =>
  ModelSection ? <ModelSection /> : null;
