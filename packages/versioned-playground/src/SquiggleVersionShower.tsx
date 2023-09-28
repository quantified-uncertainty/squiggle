"use client";
import { FC } from "react";
import { SquiggleVersion, checkSquiggleVersion } from "./versions.js";
import { CodeBracketIcon, WrenchIcon } from "@quri/ui";

export function versionTitle(version: SquiggleVersion) {
  return version === "dev" ? "Next" : version;
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
  const CurrentIcon = versionIcon(version);

  return (
    <div className="flex items-center gap-2">
      <CurrentIcon size={14} className="text-slate-500" />
      <div className="text-slate-600 text-sm">
        {uncheckedVersionTitle(version)}
      </div>
    </div>
  );
};
