import { FC, Suspense } from "react";

import { LinkButton } from "@/components/ui/LinkButton";
import { newModelRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

import { MainAreaLayout } from "../../components/layout/MainAreaLayout";

const MainArea: FC = async () => {
  const page = await loadModelCards();

  return <ModelList page={page} showOwner={true} />;
};

const Actions: FC = async () => {
  const session = await auth();

  if (!session) {
    return null;
  }

  return (
    <LinkButton href={newModelRoute()} theme="primary">
      New Model
    </LinkButton>
  );
};

export default function FrontPage() {
  return (
    <MainAreaLayout
      title="Models"
      actions={
        <Suspense>
          <Actions />
        </Suspense>
      }
    >
      <MainArea />
    </MainAreaLayout>
  );
}
