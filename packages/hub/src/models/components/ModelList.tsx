"use client";
import { FC } from "react";

import { ModelCardData } from "@/server/models/data";

import { ModelCard } from "./ModelCard";

type Props = {
  models: ModelCardData[];
  // loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({
  models,
  // loadNext,
  showOwner,
}) => {
  return (
    <div>
      <div className="grid gap-y-8">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} showOwner={showOwner} />
        ))}
      </div>
      {/* {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />} */}
    </div>
  );
};
