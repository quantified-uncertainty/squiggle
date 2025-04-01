import { loadTopBinaryQuestions } from "@/metaforecast-questions/data/manifold-questions";

import { CreateFromMetaforecastForm } from "./CreateFromMetaforecastForm";

export default async function CreateQuestionSetFromMetaforecastPage() {
  const page = await loadTopBinaryQuestions();

  return <CreateFromMetaforecastForm page={page} />;
}