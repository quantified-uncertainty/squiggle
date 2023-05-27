import { graphql } from "relay-runtime";

export const ModelExportsFragment = graphql`
  fragment ModelExports on ModelRevision {
    relativeValuesExports {
      id
      ...RelativeValuesExportItem
    }
  }
`;
