import { FC } from "react";

export const TooltipAction: FC<{ act: () => void; text: string }> = ({
  act,
  text,
}) => {
  return (
    <a
      href=""
      className="text-xs text-blue-500 hover:underline"
      onClick={(e) => {
        e.preventDefault();
        act();
      }}
    >
      {text}
    </a>
  );
};
