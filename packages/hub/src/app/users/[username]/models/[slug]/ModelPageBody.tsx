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
      content {
        __typename
        ...SquiggleSnippetContent
      }
    }
  }
`;
