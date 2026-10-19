import { HubApiClient } from "@quri/hub-api-client";
import { parseSourceId } from "@quri/hub-linker";
import { SqLinker, SqModule } from "@quri/squiggle-lang";

/**
 * Linker for relative values models, so that models can `import "hub:owner/slug"`.
 *
 * `@quri/hub-linker` is version-aware and returns modules for versioned
 * squiggle-lang packages; ModelEvaluator always uses the current squiggle-lang,
 * so we need a linker that creates current `SqModule`s.
 */
export function makeRelativeValuesHubLinker(
  getModelCode: (owner: string, slug: string) => Promise<string>
): SqLinker {
  return {
    resolve: (name) => name,
    async loadModule(sourceId) {
      const { owner, slug } = parseSourceId(sourceId);
      const code = await getModelCode(owner, slug);
      return new SqModule({ name: sourceId, code });
    },
  };
}

// For client components: loads imports from the Hub instance that serves the
// page, not from production squigglehub.org, so that imports resolve in local
// development and preview deployments.
// Server code should use `relativeValuesServerLinker` instead.
export const relativeValuesHubLinker = makeRelativeValuesHubLinker(
  (owner, slug) =>
    new HubApiClient(window.location.origin).getModelCode(owner, slug)
);
