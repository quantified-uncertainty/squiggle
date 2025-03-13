import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { parseSourceId } from "@quri/hub-linker";

import { loadModelCardAction } from "@/models/actions/loadModelCardAction";
import { ModelCard } from "@/models/components/ModelCard";
import { ModelCardDTO } from "@/models/data/cards";

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
    loadModelCardAction({ owner, slug }).then((result) => {
      if (result?.data) {
        setModel(result.data);
      } else {
        // TODO - handle errors
        setModel(null);
      }
    });
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
