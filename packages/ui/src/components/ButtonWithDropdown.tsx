import clsx from "clsx";
import { FC, ReactNode } from "react";

import { Dropdown, TriangleIcon } from "../index.js";
import { Button, ButtonGroup, ButtonProps } from "./Button.js";

type Props = ButtonProps & {
  renderDropdown(options: { close(): void }): ReactNode;
};

export const ButtonWithDropdown: FC<Props> = ({ renderDropdown, ...props }) => {
  return (
    <ButtonGroup>
      <Button {...props} />
      {/* Button -> Dropdown order is important, because Button must be a direct child of ButtonGroup */}
      <Button
        noLayout
        size={props.size}
        theme={props.theme}
        disabled={props.disabled}
      >
        <Dropdown render={renderDropdown} placement="bottom-end" fullHeight>
          <div
            className={clsx(
              props.size === "small" ? "px-1.5" : "px-3",
              "flex h-full items-center"
            )}
          >
            <TriangleIcon
              className="rotate-180"
              size={props.size === "small" ? 10 : 12}
            />
          </div>
        </Dropdown>
      </Button>
    </ButtonGroup>
  );
};
