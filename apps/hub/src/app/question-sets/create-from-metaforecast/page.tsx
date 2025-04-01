import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { questionSetsRoute } from "@/lib/routes";
import { loadTopBinaryQuestions } from "@/metaforecast-questions/data/manifold-questions";

import { CreateFromMetaforecastForm } from "./CreateFromMetaforecastForm";

export default async function CreateQuestionSetFromMetaforecastPage() {
  const page = await loadTopBinaryQuestions();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create Question Set from Metaforecast</H2>
        <StyledLink href={questionSetsRoute()}>
          ← Back to Question Sets
        </StyledLink>
      </div>

      <CreateFromMetaforecastForm page={page} />
    </div>
  );
}
