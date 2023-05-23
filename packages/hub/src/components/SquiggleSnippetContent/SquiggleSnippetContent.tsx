import { graphql } from "relay-runtime";

// common for edit and view tabs
export const SquiggleSnippetContentFragment = graphql`
  fragment SquiggleSnippetContent on SquiggleSnippet {
    code
  }
`;
