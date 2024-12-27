"use client";
import { format } from "date-fns";
import { FC } from "react";

import { LoadMore } from "@/components/LoadMore";
import { StyledLink } from "@/components/ui/StyledLink";
import { UsernameLink } from "@/components/UsernameLink";
import { commonDateFormat } from "@/lib/constants";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { modelRevisionRoute } from "@/lib/routes";
import { Paginated } from "@/lib/types";
import { ModelCardDTO } from "@/models/data/cards";
import { ModelRevisionDTO } from "@/models/data/revisions";

const ModelRevisionItem: FC<{
  model: ModelCardDTO;
  revision: ModelRevisionDTO;
}> = ({ model, revision }) => {
  return (
    <div key={revision.id}>
      <div>
        <StyledLink
          href={modelRevisionRoute({
            owner: model.owner.slug,
            slug: model.slug,
            revisionId: revision.id,
          })}
        >
          {format(revision.createdAt, commonDateFormat)}
        </StyledLink>
        {revision.author ? (
          <>
            {" "}
            by <UsernameLink username={revision.author.username} />
          </>
        ) : null}
      </div>
      {revision.comment ? (
        <div className="text-xs text-slate-700">{revision.comment}</div>
      ) : null}

      <div className="text-xs text-slate-700">{`Build Status: ${revision.buildStatus}`}</div>
      {revision.lastBuild && (
        <div className="text-xs text-slate-700">{`Build Time: ${revision.lastBuild.runSeconds.toFixed(2)}s`}</div>
      )}
      {revision.variableRevisions.length > 0 ? (
        <div className="text-xs text-emerald-700">
          {`${revision.variableRevisions.length} variables`}
        </div>
      ) : null}
    </div>
  );
};

export const ModelRevisionsList: FC<{
  page: Paginated<ModelRevisionDTO>;
  model: ModelCardDTO;
}> = ({ page: initialPage, model }) => {
  const { items: revisions, loadNext } = usePaginator(initialPage);

  return (
    <div>
      <div className="space-y-2">
        {revisions.map((revision) => (
          <ModelRevisionItem
            key={revision.id}
            model={model}
            revision={revision}
          />
        ))}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} />}
    </div>
  );
};