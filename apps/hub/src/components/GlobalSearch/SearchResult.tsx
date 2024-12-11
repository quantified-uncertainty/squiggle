import { FC } from "react";
import { components, type OptionProps } from "react-select";

import {
  SearchResultItem,
  TypedSearchResultItem,
} from "@/app/api/search/schema";

import { Link } from "../ui/Link";
import { SearchOption } from "./";
import { SearchResultGroup } from "./SearchResultGroup";
import { SearchResultModel } from "./SearchResultModel";
import { SearchResultRelativeValuesDefinition } from "./SearchResultRelativeValuesDefinition";
import { SearchResultUser } from "./SearchResultUser";

export type SearchResultComponent<
  T extends SearchResultItem["object"]["type"],
> = FC<{
  item: TypedSearchResultItem<T>;
}>;

const OkSearchResult: FC<{
  item: SearchResultItem;
}> = ({ item }) => {
  switch (item.object.type) {
    case "Model":
      return (
        <SearchResultModel item={item as TypedSearchResultItem<"Model">} />
      );
    case "RelativeValuesDefinition":
      return (
        <SearchResultRelativeValuesDefinition
          item={item as TypedSearchResultItem<"RelativeValuesDefinition">}
        />
      );
    case "User":
      return <SearchResultUser item={item as TypedSearchResultItem<"User">} />;
    case "Group":
      return (
        <SearchResultGroup item={item as TypedSearchResultItem<"Group">} />
      );
    default:
      return (
        <div>
          Unknown result type: <strong>{item.object satisfies never}</strong>
        </div>
      );
  }
};

export const SearchResult: FC<OptionProps<SearchOption, false>> = ({
  children,
  ...props
}) => {
  switch (props.data.type) {
    case "ok":
      return (
        <components.Option {...props}>
          <Link href={props.data.item.link}>
            <OkSearchResult item={props.data.item} />
          </Link>
        </components.Option>
      );
    case "error":
      return (
        <components.Option {...props} isDisabled>
          <div className="text-xs text-red-500">
            Error: {props.data.message}
          </div>
        </components.Option>
      );
    default:
      throw new Error(`Unexpected data ${props.data satisfies never}`);
  }
};
