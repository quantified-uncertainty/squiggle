"use client";
import { FC } from "react";

import { GlobeIcon } from "@quri/ui";

import { PageManuDesktopHeader } from "../ui/PageMenu";

export const FrontpageNavDesktopHeader: FC = () => {
  return <PageManuDesktopHeader icon={GlobeIcon} title="All Entities" />;
};
