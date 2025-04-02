export function chooseUsernameRoute() {
  return "/settings/choose-username";
}

export function modelRoute({ owner, slug }: { owner: string; slug: string }) {
  return `/models/${owner}/${slug}`;
}

export function ownerRoute(owner: { __typename: string; slug: string }) {
  switch (owner.__typename) {
    case "User":
      return userRoute({ username: owner.slug });
    case "Group":
      return groupRoute({ slug: owner.slug });
    default:
      throw new Error(`Unknown owner type ${owner.__typename}`);
  }
}

export function isModelRoute(url: string) {
  return url.match("^/models/[^/]+/[^/]+$");
}

export function isAiRoute(url: string) {
  return url.match("^/ai(/.*)?$");
}

export function aiRoute() {
  return "/ai";
}

//Triggers on the model route and all subroutes
export function isModelSubroute(url: string) {
  return url.match("^/models/[^/]+/[^/]+");
}

// used by useFixModelUrlCasing hook
export function patchModelRoute({
  pathname,
  owner,
  slug,
}: {
  pathname: string;
  owner: string;
  slug: string;
}) {
  const match = pathname.match("^/models/[^/]+/[^/]+($|/.*)");
  if (!match) {
    throw new Error("Not a model route");
  }
  return `/models/${owner}/${slug}${match[1]}`;
}

export function modelForRelativeValuesExportRoute({
  owner,
  slug,
  variableName,
  mode = "list",
}: {
  owner: string;
  slug: string;
  variableName: string;
  mode?: "list" | "grid" | "plot";
}) {
  const modelUrl = modelRoute({ owner, slug });
  const baseRoute = `${modelUrl}/relative-values/${variableName}`;
  switch (mode) {
    case "list":
      return baseRoute;
    default:
      return `${baseRoute}/${mode}`;
  }
}

export function isModelRelativeValuesRoute(url: string) {
  return url.match("^/models/[^/]+/[^/]+/relative-values/[^/]+$");
}

export function variableRoute({
  owner,
  modelSlug,
  variableName,
}: {
  owner: string;
  modelSlug: string;
  variableName: string;
}) {
  const modelUrl = modelRoute({ owner, slug: modelSlug });
  return `${modelUrl}/variables/${variableName}`;
}

export function variableRevisionRoute({
  owner,
  modelSlug,
  variableName,
  revisionId,
}: {
  owner: string;
  modelSlug: string;
  variableName: string;
  revisionId: string;
}) {
  const modelUrl = modelRoute({ owner, slug: modelSlug });
  return `${modelUrl}/variables/${variableName}/revisions/${revisionId}`;
}

export function modelViewRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/models/${username}/${slug}/view`;
}

export function modelRevisionsRoute(params: { owner: string; slug: string }) {
  return `${modelRoute(params)}/revisions`;
}

export function modelRevisionRoute({
  owner,
  slug,
  revisionId,
}: {
  owner: string;
  slug: string;
  revisionId: string;
}) {
  return `${modelRoute({ owner, slug })}/revisions/${revisionId}`;
}

export function relativeValuesRoute({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}) {
  return `/relative-values/${owner}/${slug}`;
}

export function relativeValuesEditRoute(props: {
  owner: string;
  slug: string;
}) {
  return relativeValuesRoute(props) + "/edit";
}

export function userRoute({ username }: { username: string }) {
  return `/users/${username}`;
}

export function userDefinitionsRoute({ username }: { username: string }) {
  return `/users/${username}/definitions`;
}

export function userGroupsRoute({ username }: { username: string }) {
  return `/users/${username}/groups`;
}

export function userVariablesRoute({ username }: { username: string }) {
  return `/users/${username}/variables`;
}

export function groupsRoute() {
  return "/groups";
}

export function definitionsRoute() {
  return "/definitions";
}

export function variablesRoute() {
  return "/variables";
}

export function groupRoute({ slug }: { slug: string }) {
  return `/groups/${slug}`;
}

export function groupMembersRoute({ slug }: { slug: string }) {
  return `${groupRoute({ slug })}/members`;
}

export function newModelRoute(params?: { group?: string }) {
  const paramsString = params?.group
    ? "?" + new URLSearchParams({ group: params.group }).toString()
    : "";
  return `/new/model${paramsString}`;
}

export function newDefinitionRoute() {
  return "/new/definition";
}

export function newGroupRoute() {
  return "/new/group";
}

export function aboutRoute() {
  return "/about";
}

export function privacyPolicyRoute() {
  return "/privacy";
}

export function termsOfServiceRoute() {
  return "/terms";
}

export function groupInviteLink(params: {
  groupSlug: string;
  inviteToken: string;
  blur?: boolean;
}) {
  let token = params.inviteToken;
  if (params.blur) {
    const visibleLength = 4;
    token =
      token.substring(0, visibleLength) +
      "•".repeat(token.length - visibleLength);
  }
  return `${groupRoute({
    slug: params.groupSlug,
  })}/invite-link?token=${token}`;
}

export function questionSetsRoute() {
  return "/question-sets";
}

export function questionSetRoute({ id }: { id: string }) {
  return `/question-sets/${id}`;
}

export function createQuestionSetRoute() {
  return "/question-sets/create";
}

export function createQuestionSetFromMetaforecastRoute() {
  return "/question-sets/create/metaforecast";
}

export function createQuestionSetFromGitHubIssuesRoute() {
  return "/question-sets/create/github";
}

export function evaluationsRoute() {
  return "/evals";
}

export function evaluationRoute({ id }: { id: string }) {
  return `/evals/eval/${id}`;
}

export function compareEvaluationsRoute({ ids }: { ids: string[] }) {
  return `/evals/compare?ids=${ids.join(",")}`;
}

export function epistemicAgentsRoute() {
  return "/epistemic-agents";
}

export function epistemicAgentRoute({ id }: { id: string }) {
  return `/epistemic-agents/${id}`;
}

export function createEpistemicAgentRoute() {
  return "/epistemic-agents/create";
}

export function createSquiggleAiEpistemicAgentRoute() {
  return "/epistemic-agents/create";
}

export function createManifoldEpistemicAgentRoute() {
  return "/epistemic-agents/create/manifold";
}
