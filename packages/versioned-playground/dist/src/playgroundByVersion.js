"use client";
import { lazy } from "react";
export const playgroundByVersion = {
    "0.8.5": lazy(async () => ({
        default: (await import("squiggle-components-0.8.5")).SquigglePlayground,
    })),
    dev: lazy(async () => ({
        default: (await import("@quri/squiggle-components")).SquigglePlayground,
    })),
};
//# sourceMappingURL=playgroundByVersion.js.map