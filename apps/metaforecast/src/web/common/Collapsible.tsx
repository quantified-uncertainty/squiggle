import { FC, useState } from "react";

import { FaCaretDown, FaCaretRight } from "react-icons/fa";

export const Collapsible: FC<{
  title: string;
  children: () => React.ReactElement | null;
}> = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const expand = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOpen(true);
  };

  const collapse = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOpen(false);
  };

  if (open) {
    return (
      <div>
        <a
          href="#"
          className="inline-flex items-center decoration-dashed"
          onClick={collapse}
        >
          {title} <FaCaretDown />
        </a>
        <div>{children()}</div>
      </div>
    );
  } else {
    return (
      <a
        href="#"
        className="inline-flex items-center decoration-dashed"
        onClick={expand}
      >
        {title} <FaCaretRight />
      </a>
    );
  }
};
