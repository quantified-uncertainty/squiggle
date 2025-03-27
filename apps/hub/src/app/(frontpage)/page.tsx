import { LinkButton } from "@/components/ui/LinkButton";
import { newModelRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";
import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/models/data/cards";

import { FrontpageMainAreaLayout } from "./FrontpageMainAreaLayout";

export default async function FrontPage() {
  const page = await loadModelCards();

  const session = await auth();

  return (
    <FrontpageMainAreaLayout
      title="Models"
      actions={
        session && (
          <LinkButton href={newModelRoute()} theme="primary">
            New Model
          </LinkButton>
        )
      }
    >
      <ModelList page={page} showOwner={true} />
    </FrontpageMainAreaLayout>
  );
}
