import { Metadata } from "next";

import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { GroupList } from "@/groups/components/GroupList";
import { loadGroupCards } from "@/groups/data/groupCards";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserGroupsPage({ params }: Props) {
  const { username } = await params;
  const page = await loadGroupCards({ username });

  return (
    <div>
      {page.items.length ? (
        <GroupList page={page} />
      ) : (
        <NoEntitiesCard>No groups to show.</NoEntitiesCard>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
