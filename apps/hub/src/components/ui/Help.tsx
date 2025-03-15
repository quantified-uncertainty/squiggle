import { FC } from "react";

import { HelpIcon, TextTooltip } from "@quri/ui";

export const Help: FC<{
  text: string;
}> = ({ text }) => {
  return (
    <TextTooltip text={text}>
      <HelpIcon className="inline cursor-pointer text-gray-400 hover:text-gray-700" />
    </TextTooltip>
  );
};
