"use client";

import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";
import { RelativeValuesDefinitionCardDTO } from "@/relative-values/data/cards";

import { RelativeValuesDefinitionCard } from "./RelativeValuesDefinitionCard";

type Props = {
  page: Paginated<RelativeValuesDefinitionCardDTO>;
  showOwner?: boolean;
};

export const RelativeValuesDefinitionList: FC<Props> = ({
  page: initialPage,
  showOwner,
}) => {
  const page = usePaginator(initialPage);

  if (!page.items.length) {
    return <div className="text-slate-500">No definitions to show.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {page.items.map((definition) => (
          <RelativeValuesDefinitionCard
            key={definition.id}
            definition={definition}
            showOwner={showOwner}
          />
        ))}
      </div>
      {page.loadNext && <LoadMore loadNext={page.loadNext} />}
    </div>
  );
};
