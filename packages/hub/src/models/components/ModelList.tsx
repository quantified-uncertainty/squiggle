"use client";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { usePaginator } from "@/hooks/usePaginator";
import { ModelCardDTO } from "@/server/models/data/card";
import { Paginated } from "@/server/types";

import { ModelCard } from "./ModelCard";

type Props = {
  page: Paginated<ModelCardDTO>;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({ page, showOwner }) => {
  const { items: models, loadNext } = usePaginator(page);

  return (
    <div>
      <div className="grid gap-y-8">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} showOwner={showOwner} />
        ))}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
