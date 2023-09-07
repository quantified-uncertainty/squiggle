import { Owner$data } from "./__generated__/Owner.graphql";

export function chooseUsernameRoute() {
  return "/settings/choose-username";
}

export function modelRoute({
  owner,
  slug,
}: {
  owner: Owner$data;
  slug: string;
}) {
  const ownerUrl = ownerRoute(owner);
  return `${ownerUrl}/models/${slug}`;
}

export function userModelRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `${userRoute({ username })}/models/${slug}`;
}

export function ownerRoute(owner: Owner$data) {
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
  return url.match("^/(?:users|groups)/[^/]+/models/[^/]+$");
}

//Triggers on the model route and all subroutes
export function isModelSubroute(url: string) {
  return url.match("^/(?:users|groups)/[^/]+/models/*");
}

// used by useFixModelUrlCasing hook
export function patchModelRoute({
  pathname,
  owner,
  slug,
}: {
  pathname: string;
  owner: Owner$data;
  slug: string;
}) {
  const match = pathname.match("^/(?:users|groups)/[^/]+/models/[^/]+($|/.*)");
  if (!match) {
    throw new Error("Not a model route");
  }
  const ownerUrl = ownerRoute(owner);
  return `${ownerUrl}/models/${slug}${match[1]}`;
}

export function modelForRelativeValuesExportRoute({
  owner,
  slug,
  variableName,
  mode = "list",
}: {
  owner: Owner$data;
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
  return `/users/${username}/models/${slug}/view`;
}

export function modelRevisionsRoute(params: {
  owner: Owner$data;
  slug: string;
}) {
  return `${modelRoute(params)}/revisions`;
}

export function modelRevisionRoute({
  owner,
  slug,
  revisionId,
}: {
  owner: Owner$data;
  slug: string;
  revisionId: string;
}) {
  return `${modelRoute({ owner, slug })}/revisions/${revisionId}`;
}

export function relativeValuesRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/relative-values/${slug}`;
}

export function relativeValuesEditRoute(props: {
  username: string;
  slug: string;
}) {
  return relativeValuesRoute(props) + "/edit";
}

export function userRoute({ username }: { username: string }) {
  return `/users/${username}`;
}

export function groupRoute({ slug }: { slug: string }) {
  return `/groups/${slug}`;
}

export function newModelRoute() {
  return "/new/model";
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
