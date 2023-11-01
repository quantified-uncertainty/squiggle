import { fetchQuery, graphql } from "relay-runtime";

import { SqLinker } from "@quri/squiggle-lang";

import { getCurrentEnvironment } from "@/relay/environment";
import { linkerQuery } from "@/__generated__/linkerQuery.graphql";

type ParsedSourceId = {
  owner: string;
  slug: string;
};

const PREFIX = "hub";

function parseSourceId(sourceId: string): ParsedSourceId {
  const match = sourceId.match(/^(\w+):([\w-]+)\/([\w-]+)$/);

  if (!match) {
    throw new Error("Invalid import name");
  }

  const prefix = match[1];
  if (prefix !== PREFIX) {
    throw new Error(`Only ${PREFIX}: imports are supported`);
  }

  const owner = match[2];
  const slug = match[3];

  return { owner, slug };
}

export function serializeSourceId({ owner, slug }: ParsedSourceId): string {
  return `${PREFIX}:${owner}/${slug}`;
}

export const squiggleHubLinker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadSource(sourceId: string) {
    const { owner, slug } = parseSourceId(sourceId);

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
        input: { owner, slug },
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
