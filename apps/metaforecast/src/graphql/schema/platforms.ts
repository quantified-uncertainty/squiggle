import { prisma } from "../../backend/database/prisma";
import { getPlatforms } from "../../backend/platforms/registry";
import { builder } from "../builder";

export const PlatformObj = builder.objectRef<string>("Platform").implement({
  description: "Forecasting platform supported by Metaforecast",
  fields: (t) => ({
    id: t.id({
      description: 'Short unique platform name, e.g. "xrisk"',
      resolve: (x) => x,
    }),
    label: t.string({
      description:
        'Platform name for displaying on frontend etc., e.g. "X-risk estimates"',
      resolve: (platformName) => {
        if (platformName === "metaforecast") {
          return "Metaforecast";
        }
        if (platformName === "guesstimate") {
          return "Guesstimate";
        }
        // kinda slow and repetitive, TODO - store a map {name => platform} somewhere and `getPlatform` util function?
        const platform = getPlatforms().find((p) => p.name === platformName);
        if (!platform) {
          throw new Error(`Unknown platform ${platformName}`);
        }
        return platform.label;
      },
    }),
    lastUpdated: t.field({
      type: "Date",
      nullable: true,
      resolve: async (platformName) => {
        const res = await prisma.question.aggregate({
          where: {
            platform: platformName,
          },
          _max: {
            fetched: true,
          },
        });
        return res._max.fetched;
      },
    }),
  }),
});

builder.queryField("platforms", (t) =>
  t.field({
    type: [PlatformObj],
    resolve: async (parent, args) => {
      return getPlatforms().map((platform) => platform.name);
    },
  })
);
