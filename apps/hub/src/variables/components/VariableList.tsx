"use client";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";
import { VariableCardDTO } from "@/variables/data/variableCards";

import { VariableCard } from "./VariableCard";

type Props = {
  page: Paginated<VariableCardDTO>;
};

export const VariableList: FC<Props> = ({ page: initialPage }) => {
  const page = usePaginator(initialPage);

  return page.items.length === 0 ? (
    <NoEntitiesCard>
      No variables found. To create a variable, export a variable from a model.
    </NoEntitiesCard>
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
