import { notFound } from "next/navigation";

import { ViewSquiggleSnippet } from "@/app/models/[owner]/[slug]/view/ViewSquiggleSnippet";
import { loadModelCard } from "@/models/data/cards";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

// Note: this page is currently unused, we used it a long time ago.
// Views are now per-variable, not per-model.
export default async function ViewModelPage({ params }: Props) {
  const { owner, slug } = await params;
  const model = await loadModelCard({ owner, slug });
  if (!model) {
    notFound();
  }
  const currentRevision = model.currentRevision;

  switch (currentRevision.contentType) {
    case "SquiggleSnippet": {
      if (!currentRevision.squiggleSnippet) {
        throw new Error("No squiggle snippet");
      }

      return <ViewSquiggleSnippet data={currentRevision.squiggleSnippet} />;
    }
    default:
      return <div>Unknown model type {currentRevision.contentType}</div>;
  }
}
