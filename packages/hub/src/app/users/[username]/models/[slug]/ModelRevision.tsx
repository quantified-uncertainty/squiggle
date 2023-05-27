import { graphql } from "react-relay";

export const ModelRevisionFragment = graphql`
  fragment ModelRevision on ModelRevision
  @argumentDefinitions(
    forRelativeValues: { type: "ModelRevisionForRelativeValuesInput" }
  ) {
    id
    description
    ...VariablesWithDefinitions
    # to measure length in ViewModelPageBody
    relativeValuesExports {
      id
    }
    content {
      __typename
      ...SquiggleContent
    }
    forRelativeValues(input: $forRelativeValues) {
      definition {
        currentRevision {
          ...ViewSquiggleContentForRelativeValuesDefinition
        }
      }
      variableName
    }
  }
`;
