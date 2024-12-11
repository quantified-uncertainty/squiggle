import { GroupList } from "@/groups/components/GroupList";
import { loadGroupCards } from "@/groups/data/groupCards";

export default async function OuterGroupsPage() {
  const page = await loadGroupCards();

  return <GroupList page={page} />;
}

export const dynamic = "force-dynamic";
