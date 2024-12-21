import { useMemo } from "react";

import { useToast } from "@quri/ui";

import {
  checkSquiggleVersion,
  defaultSquiggleVersion,
  SquiggleVersion,
} from "./versions.js";

export function useAdjustSquiggleVersion(version: string): SquiggleVersion {
  const toast = useToast();

  const usedVersion = useMemo<SquiggleVersion>(() => {
    if (!checkSquiggleVersion(version)) {
      toast(
        `Version ${version} is not available. Rendering with ${defaultSquiggleVersion} instead.`,
        "error"
      );
      return defaultSquiggleVersion;
    }
    return version;
  }, [version, toast]);

  return usedVersion;
}
