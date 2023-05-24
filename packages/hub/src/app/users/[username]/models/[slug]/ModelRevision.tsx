import { graphql } from "react-relay";

export const ModelRevisionFragment = graphql`
  fragment ModelRevision on ModelRevision
  @argumentDefinitions(
    forDefinitionInput: { type: "ModelRevisionForDefinitionInput" }
  ) {
    id
    description
    ...VariablesWithDefinitions
    # to measure length in ViewModelPageBody
    variablesWithDefinitions {
      id
    }
    content {
      __typename
      ...SquiggleContent
    }
    forDefinition(input: $forDefinitionInput) {
      ...ViewSquiggleContentForDefinition
      variable
    }
  }
`;
