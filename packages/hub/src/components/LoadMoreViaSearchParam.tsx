import { FC } from "react";

import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

import { LoadMore } from "./LoadMore";

type Props = {
  param?: string;
};

export const LoadMoreViaSearchParam: FC<Props> = ({ param = "limit" }) => {
  const updateSearchParams = useUpdateSearchParams();

  const action = (count: number) => {
    updateSearchParams(
      (params) => {
        if (params.get(param)) {
          const oldValue = parseInt(params.get(param) as string);
          params.set(param, String(oldValue + count));
        } else {
          params.set(param, String(count));
        }
      },
      { mode: "replace", scroll: false }
    );
  };

  return <LoadMore loadNext={action} />;
};
