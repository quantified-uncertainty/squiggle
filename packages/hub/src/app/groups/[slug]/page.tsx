import { hasGroupMembership } from "@/groups/data/helpers";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OuterGroupPage({ params }: Props) {
  const { slug } = await params;

  const page = await loadModelCards({
    ownerSlug: slug,
  });
  const isMember = await hasGroupMembership(slug);

  return (
    <div>
      {page.items.length ? (
        <ModelList page={page} showOwner={false} />
      ) : (
        <div className="text-slate-500">
          {isMember
            ? "This group doesn't have any models."
            : "This group does not have any public models."}
        </div>
      )}
    </div>
  );
}
