import { notFound } from "next/navigation";

import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/lib/routes";
import { loadModelFull } from "@/models/data/full";

import { UpgradeableModel } from "./UpgradeableModel";
import { UpgradeButton } from "./UpgradeButton";

type Props = {
  searchParams: Promise<{ owner: string; slug: string }>;
};

export default async function CompareVersionsPage({ searchParams }: Props) {
  const { owner, slug } = await searchParams;

  const model = await loadModelFull({ owner, slug });
  if (!model) {
    notFound();
  }

  const { contentType } = model.currentRevision;
  if (contentType !== "SquiggleSnippet") {
    notFound();
  }

  return (
    <div className="bg-white">
      <StyledLink
        href={modelRoute({
          owner: model.owner.slug,
          slug: model.slug,
        })}
      >
        {model.owner.slug}/{model.slug}
      </StyledLink>
      <UpgradeButton model={model} />
      <UpgradeableModel model={model} />
    </div>
  );
}
