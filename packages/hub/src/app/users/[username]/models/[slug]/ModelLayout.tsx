import { useSession } from "next-auth/react";
import { notFound, useParams, usePathname, useRouter } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useFragment, useLazyLoadQuery } from "react-relay";
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
import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import {
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
  patchModelRoute,
  userRoute,
} from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";

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

type Props = PropsWithChildren<CommonProps>;

export const entityNodes = (
  username: string,
  slug: string,
  variableName?: string
): EntityNode[] => {
  let nodes: EntityNode[] = [
    { slug: username, href: userRoute({ username }) },
    { slug, href: modelRoute({ username, slug }), icon: CodeBracketIcon },
  ];
  if (variableName) {
    nodes.push({
      slug: variableName,
      href: modelForRelativeValuesExportRoute({
        username: username,
        slug: slug,
        variableName: variableName,
      }),
      icon: ScaleIcon,
    });
  }
  return nodes;
};

export const ModelLayout: FC<Props> = ({ username, slug, children }) => {
  const { data: session } = useSession();
  const { variableName } = useParams();

  const { result } = useLazyLoadQuery<ModelLayoutQuery>(Query, {
    input: { ownerUsername: username, slug },
  });

  if (result.__typename === "NotFoundError") {
    notFound();
  }
  if (result.__typename === "BaseError") {
    throw new Error(result.message);
  }
  if (result.__typename !== "Model") {
    throw new Error("Unexpected typename");
  }
  const model = useFragment<ModelLayout$key>(Fragment, result);

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader> Relative Value Functions </DropdownMenuHeader>
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

  return (
    <EntityLayout
      nodes={entityNodes(username, slug, variableName)}
      isFluid={true}
      headerChildren={
        <>
          <EntityTab.List>
            <EntityTab.Link
              name="Code"
              icon={CodeBracketIcon}
              href={modelRoute({ username, slug })}
            />
            {Boolean(model.currentRevision.relativeValuesExports.length) && (
              <Dropdown render={({ close }) => dropDown(close)}>
                <EntityTab.Div
                  name="Exports"
                  icon={ScaleIcon}
                  count={model.currentRevision.relativeValuesExports.length}
                  selected={(pathname) => {
                    return pathname.startsWith(
                      modelRoute({ username, slug }) + "/relative-values"
                    );
                  }}
                />
              </Dropdown>
            )}
            <EntityTab.Link
              name="Revisions"
              icon={RectangleStackIcon}
              href={modelRevisionsRoute({ username, slug })}
            />
            {session?.user.username === username ? (
              <MenuButton username={username} slug={slug} />
            ) : null}
          </EntityTab.List>
        </>
      }
    >
      {children}
    </EntityLayout>
  );
};
