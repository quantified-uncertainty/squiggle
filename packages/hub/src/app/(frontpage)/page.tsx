import { ModelList } from "@/models/components/ModelList";
import { loadModelCards } from "@/server/models/data/cards";

export default async function FrontPage() {
  const page = await loadModelCards();

  return <ModelList page={page} showOwner={true} />;
}
