import { fetchQuery, graphql } from "relay-runtime";

import { SqLinker, SqModule } from "@quri/squiggle-lang";
import { versionSupportsSqProjectV2 } from "@quri/versioned-squiggle-components";

import { getCurrentEnvironment } from "@/relay/environment";

import { versionedSquigglePackages } from "../../../../versioned-components/dist/src/versionedSquigglePackages";

import { linkerQuery } from "@/__generated__/linkerQuery.graphql";

type ParsedSourceId = {
  owner: string;
  slug: string;
};

const PREFIX = "hub";

export function parseSourceId(sourceId: string): ParsedSourceId {
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

const linker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadModule(sourceId: string) {
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

    return new SqModule({
      name: sourceId,
      code: content.code,
    });
  },
};

const oldLinker: OldSqLinker = {
  resolve: (name) => name,
  loadSource: async (sourceId: string) => {
    return (await linker.loadModule(sourceId)).code;
  },
};

// export directly from versioned-components?
type SquigglePackages = Awaited<ReturnType<typeof versionedSquigglePackages>>;

// this type extraction is awkward but it works
type OldSqLinker = NonNullable<
  NonNullable<
    ConstructorParameters<
      Extract<SquigglePackages, { version: "0.9.5" }>["lang"]["SqProject"]
    >[0]
  >["linker"]
>;

export function getHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.plain(squiggle.version)) {
    return linker;
  } else {
    return oldLinker;
  }
}

export function sqProjectWithHubLinker(
  squiggle: Awaited<ReturnType<typeof versionedSquigglePackages>>
) {
  if (versionSupportsSqProjectV2.object(squiggle)) {
    return new squiggle.lang.SqProject({ linker });
  } else {
    return new squiggle.lang.SqProject({ linker: oldLinker });
  }
}
