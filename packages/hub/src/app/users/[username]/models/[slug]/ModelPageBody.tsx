import { graphql } from "react-relay";

export const ModelPageBodyFragment = graphql`
  fragment ModelPageBody on Model {
    id
    slug
    owner {
      id
      username
    }
    currentRevision {
      id
      description
      ...VariablesWithDefinitions
      # to measure length in ViewModelPageBody
      variablesWithDefinitions {
        id
      }
      content {
        __typename
        ...SquiggleSnippetContent
      }
    }
  }
`;
