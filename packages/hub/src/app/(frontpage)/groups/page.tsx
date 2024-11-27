import { GroupList } from "@/groups/components/GroupList";
import { loadGroupCards } from "@/server/groups/data";

export default async function OuterGroupsPage() {
  const page = await loadGroupCards();

  return <GroupList page={page} />;
}
