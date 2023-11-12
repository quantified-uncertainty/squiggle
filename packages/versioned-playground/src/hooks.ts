import { useMemo } from "react";

import { useToast } from "@quri/ui";

import {
  SquiggleVersion,
  checkSquiggleVersion,
  defaultSquiggleVersion,
} from "./versions.js";

export function useValidSquiggleVersion(version: string): SquiggleVersion {
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
