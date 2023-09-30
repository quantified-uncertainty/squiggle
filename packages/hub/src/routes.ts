export function chooseUsernameRoute() {
  return "/settings/choose-username";
}

export function modelRoute({ owner, slug }: { owner: string; slug: string }) {
  return `/models/${owner}/${slug}`;
}

export function userModelRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/models/${username}/${slug}`;
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

export function groupRoute({ slug }: { slug: string }) {
  return `/groups/${slug}`;
}

export function groupMembersRoute({ slug }: { slug: string }) {
  return `${groupRoute({ slug })}/members`;
}

export function newModelRoute(params?: { group: string }) {
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

export function graphqlAPIRoute() {
  return graphqlPlaygroundRoute();
}

export function graphqlPlaygroundRoute(query?: string) {
  const paramsString =
    query === undefined
      ? ""
      : "?" +
        new URLSearchParams({
          query,
        }).toString();

  return `/api/graphql${paramsString}`;
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
