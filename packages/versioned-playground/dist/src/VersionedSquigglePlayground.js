"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo, lazy, Suspense } from "react";
import { useToast } from "@quri/ui";
import { checkSquiggleVersion, defaultSquiggleVersion, } from "./versions.js";
const playgroundByVersion = {
    dev: lazy(async () => ({
        default: (await import("@quri/squiggle-components")).SquigglePlayground,
    })),
};
export const VersionedSquigglePlayground = ({ version, ...props }) => {
    const toast = useToast();
    const usedVersion = useMemo(() => {
        if (!checkSquiggleVersion(version)) {
            toast(`Playground for version ${version} is not available. Rendering with
          ${defaultSquiggleVersion} instead.`, "error");
            return defaultSquiggleVersion;
        }
        return version;
    }, [version, toast]);
    const Playground = playgroundByVersion[usedVersion];
    return (_jsx(Suspense, { fallback: null, children: _jsx(Playground, { defaultCode: props.defaultCode, distributionChartSettings: props.distributionChartSettings, renderExtraControls: props.renderExtraControls, renderExtraModal: props.renderExtraModal, onCodeChange: props.onCodeChange, onSettingsChange: props.onSettingsChange, height: props.height }) }));
};
//# sourceMappingURL=VersionedSquigglePlayground.js.map