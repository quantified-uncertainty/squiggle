import { SqProject } from "@quri/squiggle-lang";

import { projectFacet } from "../fields.js";
import { extensionFromFacets } from "../utils.js";
import { squiggleLanguageSupport } from "./squiggle.js";

export function squiggleLanguageExtension(initialProject: SqProject) {
  return extensionFromFacets({
    facets: [projectFacet.facet],
    initialValues: [initialProject],
    makeExtension: ([project]) => squiggleLanguageSupport(project),
  });
}
