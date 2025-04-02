import { MainAreaLayout } from "@/components/layout/MainAreaLayout";
import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { hasGroupMembership } from "@/groups/data/helpers";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

import { NewModelButton } from "../../../components/NewModelButton";

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
    <MainAreaLayout
      title={`Models in ${slug}`}
      actions={isMember && <NewModelButton group={slug} />}
    >
      {page.items.length ? (
        <ModelList page={page} showOwner={false} />
      ) : (
        <NoEntitiesCard>
          {isMember
            ? "This group doesn't have any models."
            : "This group does not have any public models."}
        </NoEntitiesCard>
      )}
    </MainAreaLayout>
  );
}
