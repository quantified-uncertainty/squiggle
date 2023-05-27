import { graphql } from "relay-runtime";

export const VariablesWithDefinitionsFragment = graphql`
  fragment VariablesWithDefinitions on ModelRevision {
    relativeValuesExports {
      id
      variableName
      definition {
        id
        owner {
          id
          username
        }
        slug
      }
    }
  }
`;
