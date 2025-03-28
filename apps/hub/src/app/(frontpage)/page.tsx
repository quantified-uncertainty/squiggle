import { FC, Suspense } from "react";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";
import { NewModelButton } from "@/components/NewModelButton";
import { auth } from "@/lib/server/auth";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

const MainArea: FC = async () => {
  const page = await loadModelCards();

  return <ModelList page={page} showOwner={true} />;
};

const Actions: FC = async () => {
  const session = await auth();

  if (!session) {
    return null;
  }

  return <NewModelButton />;
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
