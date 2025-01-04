import { notFound } from "next/navigation";

import { LockIcon } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
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
      <H2>
        <div className="flex items-center gap-4">
          <div>
            Compare model{" "}
            <StyledLink
              href={modelRoute({ owner: model.owner.slug, slug: model.slug })}
            >
              {model.owner.slug}/{model.slug}
            </StyledLink>
            {model.isPrivate ? (
              <LockIcon className="ml-1 inline-block h-4 w-4 text-gray-600" />
            ) : null}
          </div>
          <UpgradeButton model={model} />
        </div>
      </H2>
      <div>
        <p className="text-xs">
          Check models with their current version and the new version, then
          press the upgrade button if everything is ok.
        </p>
        <p className="text-xs">
          <strong>
            {`Code edits won't be saved, "Upgrade" button bumps only the model's version.`}
          </strong>
        </p>
      </div>
      <UpgradeableModel model={model} />
    </div>
  );
}
