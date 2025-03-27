import { FC, PropsWithChildren } from "react";

import { Card } from "@/components/ui/Card";

export const NoEntitiesCard: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Card theme="big">
      <div className="text-center text-gray-500">{children}</div>
    </Card>
  );
};
