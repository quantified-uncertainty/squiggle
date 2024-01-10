import { graphql } from "relay-runtime";

// Used in ModelEvaluator and other relative-values functions.
// Since those functions are not components or hooks, we pass around a RelativeValuesExport$data value.
export const RelativeValuesExport = graphql`
  fragment RelativeValuesExport on RelativeValuesExport {
    id
    ...RelativeValuesExportItem
    definition {
      slug
      owner {
        slug
      }
      currentRevision {
        ...RelativeValuesDefinitionRevision
      }
    }
    cache {
      firstItem
      secondItem
      resultJSON
      errorString
    }
  }
`;
