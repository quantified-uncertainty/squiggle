import { FC } from "react";

import { Button } from "@quri/ui";

import { ButtonProps } from "../../../ui/dist/components/Button";

type Props = {
  loadNext: (count: number) => void;
  size?: ButtonProps["size"];
};

export const LoadMore: FC<Props> = ({ loadNext, size }) => {
  return (
    <div className="mt-4">
      <Button size={size} onClick={() => loadNext(20)}>
        Load more
      </Button>
    </div>
  );
};
