"use client";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { usePaginator } from "@/hooks/usePaginator";
import { Paginated } from "@/server/types";
import { VariableCardDTO } from "@/server/variables/data/variableCards";

import { VariableCard } from "./VariableCard";

type Props = {
  page: Paginated<VariableCardDTO>;
};

export const VariableList: FC<Props> = ({ page: initialPage }) => {
  const page = usePaginator(initialPage);

  return page.items.length === 0 ? (
    <div>No variables found.</div>
  ) : (
    <div>
      <div className="grid gap-x-4 gap-y-8 md:grid-cols-2">
        {page.items.map((variable) => (
          <VariableCard key={variable.id} variable={variable} />
        ))}
      </div>
      {page.loadNext && <LoadMore loadNext={page.loadNext} />}
    </div>
  );
};
