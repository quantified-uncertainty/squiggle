import { graphql } from "relay-runtime";

// Used in ModelEvaluator and other relative-values functions.
// Since those functions are not components or hooks, we pass around a RelativeValuesModelRevision$data value.
export const RelativeValuesModelRevisionFragment = graphql`
  fragment RelativeValuesModelRevision on ModelRevision {
    id

    content {
      __typename
      ... on SquiggleSnippet {
        id
        code
        version
      }
    }

    forRelativeValues(input: $forRelativeValues) {
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
  }
`;
