import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ModelCard } from "@/models/components/ModelCard";
import { loadModelCardAction } from "@/server/models/actions/loadModelCardAction";
import { ModelCardDTO } from "@/server/models/data/cards";

import { parseSourceId } from "./linker";

type Props = {
  importId: string;
};

export const ImportTooltip: FC<Props> = ({ importId }) => {
  const { owner, slug } = parseSourceId(importId);

  const [model, setModel] = useState<ModelCardDTO | "loading" | null>(
    "loading"
  );

  useEffect(() => {
    // TODO - this is done with a server action, so it's not cached.
    // A route would be better.
    loadModelCardAction({ owner, slug }).then(setModel);
  }, [owner, slug]);

  return (
    <div
      className={clsx(
        "min-w-72",
        // reset font size from code editor; should this be done in <TooltipBox> from squiggle-components instead?
        "text-base"
      )}
    >
      {model === "loading" ? (
        <Skeleton height={160} />
      ) : model ? (
        <ModelCard model={model} />
      ) : (
        <div className="grid h-40 place-items-center text-xs">
          Model not found.
        </div>
      )}
    </div>
  );
};
