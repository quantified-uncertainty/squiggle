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
    className={`px-2 py-1 border-2 border-gray-400 rounded-lg text-black no-underline  hover:bg-gray-100 inline-flex flex-nowrap space-x-1 items-center text-xs md:text-lg  ${
      size === "small" ? "text-sm" : ""
    }`}
    href={url}
    target="_blank"
  >
    <span>{children}</span>
    <FaExternalLinkAlt className="text-gray-400 inline " />
  </a>
);
