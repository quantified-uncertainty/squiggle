import { Metadata } from "next";

import { GroupList } from "@/groups/components/GroupList";
import { loadGroupCards } from "@/server/groups/data";

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
        <div className="text-slate-500">No groups to show.</div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
