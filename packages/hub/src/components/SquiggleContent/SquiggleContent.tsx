import { graphql } from "relay-runtime";

// common for edit and view tabs
export const SquiggleContentFragment = graphql`
  fragment SquiggleContent on SquiggleSnippet {
    code
  }
`;
