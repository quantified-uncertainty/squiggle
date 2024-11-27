import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/server/modelHelpers";

export default async function OuterFrontPage() {
  const { models } = await loadModelCards();

  return (
    <ModelList
      models={models}
      showOwner={true}
      // loadNext={loadNext}
    />
  );
}
