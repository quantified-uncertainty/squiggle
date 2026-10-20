import { FC } from "react";

import { S1 } from "./S1.js";
import { S10 } from "./S10.js";
import { S2 } from "./S2.js";
import { S3 } from "./S3.js";
import { S4 } from "./S4.js";
import { S5 } from "./S5.js";
import { S6 } from "./S6.js";
import { S7 } from "./S7.js";
import { S8 } from "./S8.js";
import { S9 } from "./S9.js";

// The host-control scenarios, one page each (`#/s1` ... `#/s10`).
export const scenarios: {
  id: string;
  title: string;
  summary: string;
  Page: FC;
}[] = [
  {
    id: "s1",
    title: "One view, no chrome",
    summary: "Just the list, grid, plot or a custom view.",
    Page: S1,
  },
  {
    id: "s2",
    title: "Subsets and top N",
    summary: "Scope by ids, cluster or predicate; search; top N by value.",
    Page: S2,
  },
  {
    id: "s3",
    title: "Fixed or controlled unit and sort",
    summary: "Locked settings, a host-owned unit, a custom sort.",
    Page: S3,
  },
  {
    id: "s4",
    title: "Hide or replace controls",
    summary: "Slots, primitives in the host's header, error slot.",
    Page: S4,
  },
  {
    id: "s5",
    title: "Host state",
    summary: "URL state, saved preferences, linked dashboards, apiRef.",
    Page: S5,
  },
  {
    id: "s6",
    title: "Grid options",
    summary: "Half matrix, column axis, cell display, cluster bands.",
    Page: S6,
  },
  {
    id: "s7",
    title: "Plot options",
    summary: "Which plots, height, titles, reference and scales.",
    Page: S7,
  },
  {
    id: "s8",
    title: "Custom views from headless data",
    summary: "useRelativeValues in bundle and live mode; a custom chart.",
    Page: S8,
  },
  {
    id: "s9",
    title: "Labels, numbers, density, theme",
    summary: "French labels, a number formatter, compact, CSS variables.",
    Page: S9,
  },
  {
    id: "s10",
    title: "Several dashboards; server rendering",
    summary: "Shared bundle and evaluator, one provider for two views, SSR.",
    Page: S10,
  },
];
