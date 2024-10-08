import { FC } from "react";

import { ClientArtifact } from "@quri/squiggle-ai";

import { ArtifactDisplay } from "./ArtifactDisplay";

export const ArtifactList: FC<{
  title?: string;
  artifacts: Record<string, ClientArtifact>;
}> = ({ title, artifacts }) => {
  return (
    <div>
      {title && (
        <h3 className="mb-2 text-sm font-medium text-slate-500">{title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {Object.entries(artifacts).map(([key, value]) => (
          <ArtifactDisplay
            key={key}
            name={key}
            artifact={value}
            size={12}
            showArtifactName={true}
          />
        ))}
      </div>
    </div>
  );
};
