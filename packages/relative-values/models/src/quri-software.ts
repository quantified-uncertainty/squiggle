import { buildGraphModel, Model } from "@/model/utils";
import { Catalog, InterfaceWithModels, Item } from "@/types";
import { Map } from "immutable";

function getCatalog(): Catalog {
  const items: Item[] = [
    {
      id: "relative_values",
      name: "Squiggle relative values viewer",
      clusterId: "squiggle",
    },
    {
      id: "scoring_ui",
      name: "Squiggle Scoring UI for experts agreeing/disagreeing with input",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_docs",
      name: "Squiggle documentation (docs, videos, etc.)",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_api",
      name: "Squiggles API overhaul",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_annotations",
      name: "Squiggle function and plot customization",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_perf",
      name: "improve Squiggle performance",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_modules",
      name: "Add Squiggle modules and packages",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_datasources",
      name: "Add external data sources to Squiggle",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_dx",
      name: "Add Squiggle usability improvements (autocompletion, syntax highlighting, error messages)",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_dashboards",
      name: "Squiggle dashboards, custom pages with Squiggle charts",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_notebooks",
      name: "Squiggle Jupyter notebooks",
      clusterId: "squiggle",
    },
    { id: "squiggle_hub", name: "Squiggle Hub", clusterId: "squiggle" },
    {
      id: "squiggle_selfhosted_viewer",
      name: "Self-hosted Squiggle viewer",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_docstrings",
      name: "Docstrings to describe a model in the model",
      clusterId: "squiggle",
    },
    {
      id: "squiggle_time_series",
      name: "Plots over time",
      clusterId: "squiggle",
    },
    {
      id: "guesstimate_squiggle_export",
      name: "Export Guesstimate to Squiggle",
      clusterId: "guesstimate",
    },
    {
      id: "guesstimate_squiggle_cells",
      name: "Inlined Squiggle functions / Squiggle cells in Guesstimate",
      clusterId: "guesstimate",
    },
    {
      id: "guesstimate_auth",
      name: "Fix auth in Guesstimate",
      clusterId: "guesstimate",
    },
    {
      id: "guesstimate_selfhosted",
      name: "Guesstimate self-hosted flowgrid component",
      clusterId: "guesstimate",
    },
    {
      id: "metaforecast_realtime",
      name: "Metaforecast real-time capabilities",
      clusterId: "metaforecast",
    },
    {
      id: "metaforecast_metadata",
      name: "More metadata in the metaforecast",
      clusterId: "metaforecast",
    },
    {
      id: "metaforecast_squiggle",
      name: "Squiggle in Metaforecast",
      clusterId: "metaforecast",
    },
    {
      id: "metaforecast_embeds",
      name: "Clean up LW/EA forum embeds for metaforecast",
      clusterId: "metaforecast",
    },
    {
      id: "metaforecast_perf",
      name: "Metaforecast performance improvements",
      clusterId: "metaforecast",
    },
    {
      id: "metaforecast_ui",
      name: "Metaforecast UI improvements",
      clusterId: "metaforecast",
    },
    {
      id: "standard_predictions",
      name: "Public protocol for prediction engines & market",
      clusterId: "other",
    },
    {
      id: "graphql_db",
      name: "GraphQL DB with EA-related data -> Wiki",
      clusterId: "other",
    },
    {
      id: "standard_prob_models",
      name: "Standards for probabilistic models interoperability",
      clusterId: "other",
    },
  ];

  return {
    id: "quri-software",
    title: "QURI software projects",
    description:
      "Key QURI Software projects. Only large ones are captured. Value is defined as what Nuno thinks it should be",
    author: "Nuno Sempere",
    created: new Date("2022-03-12"),
    items,
    clusters: {
      squiggle: { name: "Squiggle", color: "#e410e1" },
      guesstimate: { name: "Guesstimate", color: "#1487d0" },
      metaforecast: { name: "Metaforecast", color: "#275372" },
      other: { name: "Other", color: "#999" },
    },
  };
}

function getModel(): Model {
  // values by Nuño, https://docs.google.com/spreadsheets/d/1F-5kDT_qGq2IUMJQI4Pi2FUAunmis7ix6w-NLaixBOI/edit#gid=672652952
  return buildGraphModel({
    commonCode: "",
    items: [
      ["relative_values", "1k to 5k"],
      ["scoring_ui", "500 to 2k"],
      ["squiggle_docs", "100 to 10k"],
      ["squiggle_api", "500 to 5k"],
      ["squiggle_annotations", "500 to 1k"],
      ["squiggle_perf", "250 to 1k"],
      ["squiggle_modules", "250 to 1k"],
      ["squiggle_datasources", "250 to 1k"],
      ["squiggle_dx", "250 to 1k"],
      ["squiggle_dashboards", "2k to 10k"],
      ["squiggle_notebooks", "100 to 500"],
      ["squiggle_hub", "2k to 10k"],
      ["squiggle_selfhosted_viewer", "100 to 200"],
      ["squiggle_docstrings", "100 to 200"],
      ["squiggle_time_series", "200 to 2k"],
      ["guesstimate_squiggle_export", "200 to 1k"],
      ["guesstimate_squiggle_cells", "200 to 1k"],
      ["guesstimate_auth", "500 to 10k"],
      ["guesstimate_selfhosted", "200 to 5k"],
      ["metaforecast_realtime", "500 to 2k"],
      ["metaforecast_metadata", "500 to 2k"],
      ["metaforecast_squiggle", "500 to 2k"],
      ["metaforecast_embeds", "1k to 2k"],
      ["metaforecast_perf", "100 to 1k"],
      ["metaforecast_ui", "100 to 1k"],
      ["standard_predictions", "500 to 10k"],
      ["graphql_db", "100 to 1k"],
      ["standard_prob_models", "500 to 1k"],
    ],
    catalog: getCatalog(),
    metadata: {
      author: "Nuño Sempere",
      title: "By Nuño",
      id: "nuno",
    },
  });
}

export const catalog = getCatalog();
export const models = [getModel()];
