"use client";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { usePaginator } from "@/hooks/usePaginator";
import { GroupCardDTO } from "@/server/groups/data/card";
import { Paginated } from "@/server/types";

import { GroupCard } from "./GroupCard";

type Props = {
  page: Paginated<GroupCardDTO>;
};

export const GroupList: FC<Props> = ({ page: initialPage }) => {
  const page = usePaginator(initialPage);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {page.items.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
      {page.loadNext && <LoadMore loadNext={page.loadNext} />}
    </div>
  );
};
