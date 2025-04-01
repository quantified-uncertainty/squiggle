import { FC } from "react";

import { ModalHelp } from "@/components/ui/ModalHelp";

export const ModelsHelp: FC = () => {
  return (
    <ModalHelp
      title="About Models"
      body={<p>Models are programs written in the Squiggle language.</p>}
    />
  );
};
