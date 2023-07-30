"use client";

import { useSession } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useFragment, usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import {
  CodeBracketIcon,
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  RectangleStackIcon,
  ScaleIcon,
} from "@quri/ui";

import {
  ModelLayout$data,
  ModelLayout$key,
} from "@/__generated__/ModelLayout.graphql";
import ModelLayoutQueryNode, {
  ModelLayoutQuery,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import {
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
  patchModelRoute,
} from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import { entityNodes } from "./utils";

const Fragment = graphql`
  fragment ModelLayout on Model {
    id
    slug
    owner {
      username
    }
    currentRevision {
      id
      # for length; TODO - "hasExports" field?
      relativeValuesExports {
        id
        variableName
        definition {
          slug
          owner {
            username
          }
        }
      }
    }
  }
`;

// Doing this with a fragment would be too hard, because of how layouts work in Next.js.
// So we have to do two GraphQL queries on most model pages.
const Query = graphql`
  query ModelLayoutQuery($input: QueryModelInput!) {
    result: model(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Model {
        ...ModelLayout
      }
    }
  }
`;

type CommonProps = {
  username: string;
  slug: string;
};

const MenuButton: FC<CommonProps> = ({ username, slug }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            username={username}
            slug={slug}
            close={close}
          />
          <DeleteModelAction username={username} slug={slug} close={close} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};

function useFixModelUrlCasing(model: ModelLayout$data) {
  const router = useRouter();
  const pathname = usePathname();

  const patchedPathname = patchModelRoute({
    pathname,
    slug: model.slug,
    username: model.owner.username,
  });
  if (patchedPathname && patchedPathname !== pathname) {
    router.replace(patchedPathname);
  }
}

export const ModelLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<
      typeof ModelLayoutQueryNode,
      ModelLayoutQuery
    >;
  }>
> = ({ query, children }) => {
  const { data: session } = useSession();
  const { variableName } = useParams();

  const queryRef = useSerializablePreloadedQuery(query);
  const { result } = usePreloadedQuery(Query, queryRef);

  const modelRef = extractFromGraphqlErrorUnion(result, "Model");
  const model = useFragment<ModelLayout$key>(Fragment, modelRef);

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
      <DropdownMenuSeparator />
      {model.currentRevision.relativeValuesExports.map((exportItem) => (
        <DropdownMenuLinkItem
          key={exportItem.variableName}
          href={modelForRelativeValuesExportRoute({
            username: model.owner.username,
            slug: model.slug,
            variableName: exportItem.variableName,
          })}
          title={`${exportItem.variableName}: ${exportItem.definition.slug}`}
          icon={ScaleIcon}
          close={close}
        />
      ))}
    </DropdownMenu>
  );

  const usernameAndSlug = {
    username: model.owner.username,
    slug: model.slug,
  };

  return (
    <EntityLayout
      nodes={entityNodes(model.owner.username, model.slug, variableName)}
      isFluid={true}
      headerChildren={
        <>
          <EntityTab.List>
            <EntityTab.Link
              name="Code"
              icon={CodeBracketIcon}
              href={modelRoute(usernameAndSlug)}
            />
            {Boolean(model.currentRevision.relativeValuesExports.length) && (
              <Dropdown render={({ close }) => dropDown(close)}>
                <EntityTab.Div
                  name="Exports"
                  icon={ScaleIcon}
                  count={model.currentRevision.relativeValuesExports.length}
                  selected={(pathname) => {
                    return pathname.startsWith(
                      modelRoute(usernameAndSlug) + "/relative-values"
                    );
                  }}
                />
              </Dropdown>
            )}
            <EntityTab.Link
              name="Revisions"
              icon={RectangleStackIcon}
              href={modelRevisionsRoute(usernameAndSlug)}
            />
            {session?.user.username === model.owner.username ? (
              <MenuButton {...usernameAndSlug} />
            ) : null}
          </EntityTab.List>
        </>
      }
    >
      {children}
    </EntityLayout>
  );
};
