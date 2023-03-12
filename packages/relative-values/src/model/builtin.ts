import { getQuriCatalog } from "@/catalog/builtin";
import { Map } from "immutable";
import { buildGraphModel, Model } from "./utils";

export function getQuriTextModel(): Model {
  return {
    mode: "text",
    code: `blog_post_to_software = SampleSet.fromDist(0.1 to 100)
items = {
  quri_papers_1: pointMass(1),
  quri_papers_2: 0.1 to 2,
  quri_papers_3: 0.5 to 10,
  quri_papers_4: 0.2 to 20,
  quri_papers_5: 0.2 to 3,
  quri_papers_6: 0.3 to 2,
  quri_papers_7: 1 to 20,
  quri_papers_8: 0.5 to 8,
  quri_papers_9: 0.2 to 8,
  quri_papers_10: 2 to 15,
  quri_papers_11: 1 to 5,
  quri_papers_12: 0.05 to 0.2,
  quri_papers_13: 0.1 to 3,
  quri_papers_14: 0.2 to 3,
  quri_papers_15: 0.2 to 3,
  quri_metaforecast: (1)*blog_post_to_software,
  quri_metaforecast_twitter: (0.01 to 0.1)*blog_post_to_software,
  quri_squiggle: (3 to 10)*blog_post_to_software,
  quri_foretold: (0.5 to 100)*blog_post_to_software,
  quri_homepage: (0.05 to 5)*blog_post_to_software,
  quri_utility_extractor: (0.005 to 0.2)*blog_post_to_software,
  quri_ai_safety_papers: (0.01 to 0.5)*blog_post_to_software,
  quri_ken: (0.1 to 0.5)*blog_post_to_software,
  quri_guesstimate: (50 to 10000)*blog_post_to_software
}
withSampleSetValue(item) = SampleSet.fromDist(item)
items = Dict.map(items, withSampleSetValue)

fn(intervention1, intervention2) = items[intervention1] / items[intervention2]
fn
`,
  };
}

export function getQuriGraphModel(): Model {
  return buildGraphModel({
    commonCode: "blog_post_to_software = SampleSet.fromDist(0.1 to 100)",
    items: [
      ["quri_papers_1", "pointMass(1)"],
      ["quri_papers_2", "0.1 to 2"],
      ["quri_papers_3", "0.5 to 10"],
      ["quri_papers_4", "0.2 to 20"],
      ["quri_papers_5", "0.2 to 3"],
      ["quri_papers_6", "0.3 to 2"],
      ["quri_papers_7", "1 to 20"],
      ["quri_papers_8", "0.5 to 8"],
      ["quri_papers_9", "0.2 to 8"],
      ["quri_papers_10", "2 to 15"],
      ["quri_papers_11", "1 to 5"],
      ["quri_papers_12", "0.05 to 0.2"],
      ["quri_papers_13", "0.1 to 3"],
      ["quri_papers_14", "0.2 to 3"],
      ["quri_papers_15", "0.2 to 3"],
      ["quri_metaforecast", "(1)*blog_post_to_software"],
      ["quri_metaforecast_twitter", "(0.01 to 0.1)*blog_post_to_software"],
      ["quri_squiggle", "(3 to 10)*blog_post_to_software"],
      ["quri_foretold", "(0.5 to 100)*blog_post_to_software"],
      ["quri_homepage", "(0.05 to 5)*blog_post_to_software"],
      ["quri_utility_extractor", "(0.005 to 0.2)*blog_post_to_software"],
      ["quri_ai_safety_papers", "(0.01 to 0.5)*blog_post_to_software"],
      ["quri_ken", "(0.1 to 0.5)*blog_post_to_software"],
      ["quri_guesstimate", "(50 to 10000)*blog_post_to_software"],
    ],
    catalog: getQuriCatalog(),
  });
}
