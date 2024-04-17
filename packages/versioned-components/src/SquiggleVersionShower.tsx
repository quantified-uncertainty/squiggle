"use client";
import { FC } from "react";

import { ChevronRightIcon, CodeBracketIcon, WrenchIcon } from "@quri/ui";

import { checkSquiggleVersion, SquiggleVersion } from "./versions.js";

export function versionTitle(version: SquiggleVersion) {
  return version === "dev" ? "next" : `v${version}`;
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
    <div className="flex h-full cursor-pointer select-none items-center space-x-1.5 whitespace-nowrap px-4 text-sm font-light text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
      <div className="flex">{uncheckedVersionTitle(version)}</div>
      <ChevronRightIcon className="rotate-90" size={14} />
    </div>
  );
};
