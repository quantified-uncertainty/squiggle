import { FC, ReactNode } from "react";
import { Button, ButtonGroup, ButtonProps } from "./Button.js";
import { Dropdown, TriangleIcon } from "../index.js";

type Props = ButtonProps & {
  renderDropdown(options: { close(): void }): ReactNode;
};

export const ButtonWithDropdown: FC<Props> = ({ renderDropdown, ...rest }) => {
  return (
    <ButtonGroup>
      <Button {...rest} />
      {/* Button -> Dropdown order is important, because Button must be a direct child of ButtonGroup */}
      <Button noLayout>
        <Dropdown render={renderDropdown} placement="bottom-end" fullHeight>
          <div className="px-3 flex h-full items-center">
            <TriangleIcon className="rotate-180 text-gray-400" size={12} />
          </div>
        </Dropdown>
      </Button>
    </ButtonGroup>
  );
};
