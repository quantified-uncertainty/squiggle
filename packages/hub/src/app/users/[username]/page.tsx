import { Metadata } from "next";

import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/server/models/data/cards";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const page = await loadModelCards({
    ownerSlug: username,
  });

  return (
    <div>
      {page.items.length ? (
        <ModelList page={page} showOwner={false} />
      ) : (
        <div className="text-slate-500">No models to show.</div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
