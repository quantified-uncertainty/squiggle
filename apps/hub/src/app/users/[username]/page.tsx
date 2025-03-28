import { Metadata } from "next";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";
import { NoEntitiesCard } from "@/components/NoEntitiesCard";
import { LinkButton } from "@/components/ui/LinkButton";
import { newModelRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const page = await loadModelCards({
    ownerSlug: username,
  });
  const session = await auth();
  const isMe = username === session?.user.username;

  return (
    <MainAreaLayout
      title={`Models by ${username}`}
      actions={
        isMe && (
          <LinkButton href={newModelRoute()} theme="primary">
            New Model
          </LinkButton>
        )
      }
    >
      {page.items.length ? (
        <ModelList page={page} showOwner={false} />
      ) : (
        <NoEntitiesCard>No models to show.</NoEntitiesCard>
      )}
    </MainAreaLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
