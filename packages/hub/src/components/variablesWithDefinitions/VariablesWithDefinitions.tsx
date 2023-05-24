import { graphql } from "relay-runtime";

export const VariablesWithDefinitionsFragment = graphql`
  fragment VariablesWithDefinitions on ModelRevision {
    variablesWithDefinitions {
      id
      variable
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
