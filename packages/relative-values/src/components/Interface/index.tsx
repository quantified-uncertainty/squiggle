import dynamic from "next/dynamic";
import { FC } from "react";

export const SSRSafeInterface =
  typeof window === "undefined"
    ? null
    : dynamic(() =>
        import("./SSRUnsafeInterface").then((mod) => mod.SSRUnsafeInterface)
      );

export const Interface: FC = () =>
  SSRSafeInterface ? <SSRSafeInterface /> : null;
