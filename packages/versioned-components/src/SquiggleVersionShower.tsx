"use client";
import { FC } from "react";

import { ChevronRightIcon, CodeBracketIcon, WrenchIcon } from "@quri/ui";

import { checkSquiggleVersion, SquiggleVersion } from "./versions.js";

export function versionTitle(version: SquiggleVersion) {
  return version === "dev" ? "vNext" : `v${version}`;
}

export function uncheckedVersionTitle(version: string) {
  const versionIsValid = checkSquiggleVersion(version);
  if (versionIsValid) {
    return versionTitle(version);
  } else {
    return `${version} (unknown)`;
  }
}

export function versionIcon(version: string) {
  return version === "dev" ? WrenchIcon : CodeBracketIcon;
}

export const SquiggleVersionShower: FC<{ version: string }> = ({ version }) => {
  return (
    <div className="flex items-center font-light space-x-1.5 text-sm px-4 h-full cursor-pointer hover:bg-gray-50 select-none whitespace-nowrap transition hover:text-gray-900 text-gray-500">
      <div className="flex">{uncheckedVersionTitle(version)}</div>
      <ChevronRightIcon className="rotate-90" size={14} />
    </div>
  );
};
