"use client";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { GroupCardDTO } from "@/groups/data/groupCards";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";

import { GroupCard } from "./GroupCard";

type Props = {
  page: Paginated<GroupCardDTO>;
};

export const GroupList: FC<Props> = ({ page: initialPage }) => {
  const page = usePaginator(initialPage);

  return page.items.length === 0 ? (
    <NoEntitiesCard>No groups found.</NoEntitiesCard>
  ) : (
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
