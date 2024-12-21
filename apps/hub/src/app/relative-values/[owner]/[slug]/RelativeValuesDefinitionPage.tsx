"use client";
import { FC } from "react";

import { LockIcon } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelForRelativeValuesExportRoute } from "@/lib/routes";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { RelativeValuesExportCardDTO } from "@/relative-values/data/exports";
import { RelativeValuesDefinitionFullDTO } from "@/relative-values/data/full";

const ExportItem: FC<{
  modelExport: RelativeValuesExportCardDTO;
}> = ({ modelExport }) => {
  return (
    <div className="flex items-center gap-1">
      <StyledLink
        href={modelForRelativeValuesExportRoute({
          owner: modelExport.modelRevision.model.owner.slug,
          slug: modelExport.modelRevision.model.slug,
          variableName: modelExport.variableName,
        })}
      >
        {modelExport.modelRevision.model.owner.slug}/
        {modelExport.modelRevision.model.slug}
      </StyledLink>
      {modelExport.modelRevision.model.isPrivate && (
        <LockIcon size={14} className="text-slate-500" />
      )}
    </div>
  );
};

export const RelativeValuesDefinitionPage: FC<{
  definition: RelativeValuesDefinitionFullDTO;
  modelExports: RelativeValuesExportCardDTO[];
}> = ({ definition, modelExports }) => {
  return (
    <div className="mt-4">
      <div>
        {modelExports.length ? (
          <section className="mb-4">
            <H2>Implemented by:</H2>
            <div className="flex flex-col">
              {modelExports.map((row) => (
                <ExportItem key={row.id} modelExport={row} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RelativeValuesDefinitionRevision revision={definition.currentRevision} />
    </div>
  );
};
