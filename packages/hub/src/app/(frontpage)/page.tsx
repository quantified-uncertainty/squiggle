import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/server/models/data";

export default async function FrontPage() {
  const { models } = await loadModelCards();

  return (
    <ModelList
      models={models}
      showOwner={true}
      // loadNext={loadNext}
    />
  );
}
