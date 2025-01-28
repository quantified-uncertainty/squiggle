import { getFrontpage } from "../../backend/frontpage";
import { builder } from "../builder";
import { QuestionObj } from "./questions";

builder.queryField("frontpage", (t) =>
  t.field({
    type: [QuestionObj],
    description: "Get a list of questions that are currently on the frontpage",
    resolve: async () => {
      return await getFrontpage();
    },
  })
);
