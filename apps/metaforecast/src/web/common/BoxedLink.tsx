import { FC, PropsWithChildren } from "react";

import { FaExternalLinkAlt } from "react-icons/fa";

type Props = {
  url: string;
  size?: "normal" | "small";
};

export const BoxedLink: FC<PropsWithChildren<Props>> = ({
  url,
  size = "normal",
  children,
}) => (
  <a
    className={`inline-flex flex-nowrap items-center space-x-1 rounded-lg border-2 border-gray-400 px-2 py-1 text-xs text-black no-underline hover:bg-gray-100 md:text-lg ${
      size === "small" ? "text-sm" : ""
    }`}
    href={url}
    target="_blank"
  >
    <span>{children}</span>
    <FaExternalLinkAlt className="inline text-gray-400" />
  </a>
);
