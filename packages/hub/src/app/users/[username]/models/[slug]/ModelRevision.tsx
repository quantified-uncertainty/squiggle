import { graphql } from "react-relay";

// shared by multiple components
// TODO: Why doesn't the definition get the slug and owner?
export const ModelRevisionFragment = graphql`
  fragment ModelRevision on ModelRevision
  @argumentDefinitions(
    forRelativeValues: { type: "ModelRevisionForRelativeValuesInput" }
  ) {
    id

    # unfortunately we have to repeat ModelExports fragment here,
    # because of EditSquiggleSnippetModel component
    relativeValuesExports {
      id
      variableName
      definition {
        slug
        owner {
          username
        }
      }
    }
    ...ModelExports

    content {
      __typename
      ...SquiggleContent
    }

    forRelativeValues(input: $forRelativeValues) {
      id
      ...RelativeValuesExportItem
      definition {
        slug
        owner {
          username
        }
        createdAtTimestamp
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
