import { Dashboard } from "@prisma/client";

import { prisma } from "../../backend/database/prisma";
import { hash } from "../../backend/utils/hash";
import { builder } from "../builder";
import { QuestionObj } from "./questions";

const DashboardObj = builder.objectRef<Dashboard>("Dashboard").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title", {
      description: "The title of the dashboard",
    }),
    description: t.exposeString("description", {
      description: "The longer description of the dashboard",
    }),
    creator: t.exposeString("creator", {
      description: 'The creator of the dashboard, e.g. "Peter Parker"',
    }),
    questions: t.field({
      type: [QuestionObj],
      description: "The list of questions on the dashboard",
      resolve: async (parent) => {
        return await prisma.question.findMany({
          where: {
            id: {
              in: parent.contents as string[],
            },
          },
        });
      },
    }),
  }),
});

builder.queryField("dashboard", (t) =>
  t.field({
    type: DashboardObj,
    nullable: true,
    description: "Look up a single dashboard by its id",
    args: {
      id: t.arg({ type: "ID", required: true }),
    },
    resolve: async (parent, args) => {
      return await prisma.dashboard.findUnique({
        where: {
          id: String(args.id),
        },
      });
    },
  })
);

const CreateDashboardResult = builder
  .objectRef<{ dashboard: Dashboard }>("CreateDashboardResult")
  .implement({
    fields: (t) => ({
      dashboard: t.field({
        type: DashboardObj,
        resolve: (parent) => parent.dashboard,
      }),
    }),
  });

const CreateDashboardInput = builder.inputType("CreateDashboardInput", {
  fields: (t) => ({
    title: t.string({
      required: true,
      description: "The title of the dashboard",
    }),
    description: t.string({
      description: "The longer description of the dashboard",
    }),
    creator: t.string({
      description: 'The creator of the dashboard, e.g. "Peter Parker"',
    }),
    ids: t.idList({ required: true, description: "List of question ids" }),
  }),
});

builder.mutationField("createDashboard", (t) =>
  t.field({
    type: CreateDashboardResult,
    description:
      "Create a new dashboard; if the dashboard with given ids already exists then it will be returned instead.",
    args: {
      input: t.arg({ type: CreateDashboardInput, required: true }),
    },
    resolve: async (parent, args) => {
      const id = hash(JSON.stringify(args.input.ids));
      const dashboard = await prisma.dashboard.upsert({
        where: {
          id,
        },
        update: {},
        create: {
          id,
          title: args.input.title,
          description: args.input.description || "",
          creator: args.input.creator || "",
          contents: args.input.ids,
          extra: [],
          timestamp: new Date(),
        },
      });
      return {
        dashboard,
      };
    },
  })
);
