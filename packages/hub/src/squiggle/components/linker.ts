import { fetchQuery, graphql } from "relay-runtime";

import { SqLinker } from "@quri/squiggle-lang";

import { getCurrentEnvironment } from "@/relay/environment";
import { linkerQuery } from "@/__generated__/linkerQuery.graphql";

export const squiggleHubLinker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadSource(sourceId: string) {
    if (!sourceId.startsWith("hub:")) {
      throw new Error("Only hub: imports are supported");
    }

    const match = sourceId.match(/^hub:(\w+)\/(\w+)$/);

    if (!match) {
      throw new Error("Invalid import name");
    }

    const ownerSlug = match[1];
    const modelSlug = match[2];

    const environment = getCurrentEnvironment();

    const result = await fetchQuery<linkerQuery>(
      environment,
      graphql`
        query linkerQuery($input: QueryModelInput!) {
          model(input: $input) {
            __typename
            ... on Model {
              id
              currentRevision {
                content {
                  __typename
                  ... on SquiggleSnippet {
                    code
                  }
                }
              }
            }
          }
        }
      `,
      {
        input: {
          owner: ownerSlug,
          slug: modelSlug,
        },
      }
      // toPromise is discouraged by Relay docs, but should be fine if we don't do any streaming
    ).toPromise();

    if (!result || result.model.__typename !== "Model") {
      throw new Error(`Failed to fetch sources for ${sourceId}`);
    }

    const content = result.model.currentRevision.content;
    if (content.__typename !== "SquiggleSnippet") {
      throw new Error(`${sourceId} is not a SquiggleSnippet`);
    }

    return content.code;
  },
};
