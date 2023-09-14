import { FC } from "react";

import { Button } from "@quri/ui";

type Props = {
  loadNext: (count: number) => void;
};

export const LoadMore: FC<Props> = ({ loadNext }) => {
  return (
    <div className="mt-4">
      <Button onClick={() => loadNext(20)}>Load more</Button>
    </div>
  );
};
