import Link from "next/link";
import { FC } from "react";
import { useFragment } from "react-relay";

import { Dropdown, DropdownMenu } from "@quri/ui";

import { ModelExports$key } from "@/__generated__/ModelExports.graphql";
import { RelativeValuesExportItem$key } from "@/__generated__/RelativeValuesExportItem.graphql";
import { modelForRelativeValuesExportRoute, modelViewRoute } from "@/routes";
import { ModelExportsFragment } from "./ModelExports";
import {
  RelativeValuesExportItem,
  RelativeValuesExportItemFragment,
} from "./RelativeValuesExportItem";

type Props = {
  modelUsername: string;
  modelSlug: string;
  dataRef: ModelExports$key;
  selected: RelativeValuesExportItem$key | undefined;
};

const LinkedItem: FC<{
  itemRef: RelativeValuesExportItem$key;
  modelUsername: string;
  modelSlug: string;
}> = ({ itemRef, modelUsername, modelSlug }) => {
  const item = useFragment(RelativeValuesExportItemFragment, itemRef);

  return (
    <Link
      href={modelForRelativeValuesExportRoute({
        username: modelUsername,
        slug: modelSlug,
        variableName: item.variableName,
      })}
    >
      <RelativeValuesExportItem itemRef={itemRef} />
    </Link>
  );
};

const Menu: FC<Props> = ({ dataRef, modelUsername, modelSlug }) => {
  const { relativeValuesExports } = useFragment(ModelExportsFragment, dataRef);

  return (
    <DropdownMenu>
      <Link
        href={modelViewRoute({
          username: modelUsername,
          slug: modelSlug,
        })}
      >
        <RelativeValuesExportItem itemRef={undefined} />
      </Link>
      {relativeValuesExports.map((entry) => (
        <LinkedItem
          itemRef={entry}
          modelUsername={modelUsername}
          modelSlug={modelSlug}
          key={entry.id}
        />
      ))}
    </DropdownMenu>
  );
};

export const ModelExportsPicker: FC<Props> = (props) => {
  return (
    <div className="flex">
      <Dropdown render={() => <Menu {...props} />}>
        <div className="border border-slate-200 rounded cursor-pointer">
          <RelativeValuesExportItem itemRef={props.selected} />
        </div>
      </Dropdown>
    </div>
  );
};
