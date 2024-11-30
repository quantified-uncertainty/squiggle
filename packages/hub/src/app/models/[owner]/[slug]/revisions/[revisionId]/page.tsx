import { format } from "date-fns";
import { notFound } from "next/navigation";

import { CommentIcon } from "@quri/ui";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/constants";
import { modelRoute } from "@/lib/routes";
import { loadModelRevisionFull } from "@/models/data/fullRevision";

import { ModelRevisionView } from "./ModelRevisionView";

export default async function ModelPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string; revisionId: string }>;
}) {
  const { owner, slug, revisionId } = await params;

  const revision = await loadModelRevisionFull({
    owner,
    slug,
    revisionId,
  });

  if (!revision) {
    notFound();
  }

  const modelUrl = modelRoute({
    owner,
    slug,
  });

  return (
    <div>
      <div className="border-b border-gray-300">
        <div className="space-y-1 px-8 pb-4 pt-4">
          <div className="text-sm">
            <span className="text-slate-500">Version from</span>{" "}
            {format(revision.createdAt, commonDateFormat)}.{" "}
            <span className="text-slate-500">Squiggle</span>{" "}
            {revision.squiggleSnippet.version}.
          </div>
          <div className="text-sm">
            <StyledLink href={modelUrl}>Go to latest version</StyledLink>
          </div>
          {revision.comment ? (
            <div className="flex items-center gap-2">
              <CommentIcon size={14} className="text-slate-400" />
              <div className="text-sm">{revision.comment}</div>
            </div>
          ) : null}
        </div>
      </div>
      <ModelRevisionView revision={revision} />
    </div>
  );
}
