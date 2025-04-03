import { FC } from "react";

import { ModalHelp } from "@/components/ui/ModalHelp";
import { StyledA } from "@/components/ui/StyledA";
import { SQUIGGLE_LANGUAGE_WEBSITE } from "@/lib/constants";

export const ModelsHelp: FC = () => {
  return (
    <ModalHelp
      title="About Models"
      body={
        <p>
          Models are programs written in the{" "}
          <StyledA href={SQUIGGLE_LANGUAGE_WEBSITE} target="_blank">
            Squiggle language
          </StyledA>
          .
        </p>
      }
    />
  );
};
