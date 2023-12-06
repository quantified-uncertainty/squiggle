"use client";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useRef } from "react";
import { fetchQuery, graphql, useRelayEnvironment } from "react-relay";
import {
  components,
  DropdownIndicatorProps,
  SelectInstance,
} from "react-select";
import AsyncSelect from "react-select/async";

import { SearchIcon } from "@quri/ui";

import { GlobalSearchQuery } from "@/__generated__/GlobalSearchQuery.graphql";
import { SearchResult$key } from "@/__generated__/SearchResult.graphql";
import { SearchResult } from "./SearchResult";

export const Query = graphql`
  query GlobalSearchQuery($text: String!) {
    result: search(text: $text) {
      __typename
      ... on BaseError {
        message
      }
      ... on QuerySearchConnection {
        edges {
          cursor
          node {
            id
            link
            object {
              ...SearchResult
            }
          }
        }
      }
    }
  }
`;

export type SearchOption =
  | {
      type: "object";
      id: string;
      link: string;
      object: SearchResult$key;
    }
  | {
      type: "error";
      message: string;
    };

const DropdownIndicator = (props: DropdownIndicatorProps<SearchOption>) => {
  return (
    <components.DropdownIndicator {...props}>
      <SearchIcon />
    </components.DropdownIndicator>
  );
};

export const GlobalSearch: FC = () => {
  const environment = useRelayEnvironment();
  const router = useRouter();

  const loadOptions = async (text: string): Promise<SearchOption[]> => {
    const result = await fetchQuery<GlobalSearchQuery>(environment, Query, {
      text,
    }).toPromise();
    if (!result) return [];
    if (result.result.__typename === "BaseError") {
      return [
        {
          type: "error",
          message: result.result.message,
        },
      ];
    } else if (result.result.__typename !== "QuerySearchConnection") {
      return [
        {
          type: "error",
          message: "Unknown error",
        },
      ];
    }
    return result.result.edges.map((edge) => ({
      type: "object",
      id: edge.node.id,
      link: edge.node.link,
      object: edge.node.object,
    }));
  };

  // https://github.com/JedWatson/react-select/discussions/4669#discussioncomment-1994888
  const ref = useRef<SelectInstance<SearchOption> | null>(null);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      // I assume this is fast because it will be called on each "Escape" press, even when the search is not focused.
      ref.current?.blur();
    }
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      event.stopPropagation();
      ref.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <AsyncSelect<SearchOption>
      ref={ref}
      unstyled
      loadOptions={loadOptions}
      components={{
        Option: SearchResult,
        DropdownIndicator,
      }}
      isOptionDisabled={(option) => option.type === "error"}
      closeMenuOnSelect
      blurInputOnSelect
      openMenuOnClick={false}
      placeholder="Search..."
      getOptionValue={(option) =>
        option.type === "error" ? "error" : option.id
      }
      getOptionLabel={(option) =>
        option.type === "error" ? "error" : option.id
      }
      onChange={(option) => {
        if (option?.type === "object") {
          router.push(option.link);
        }
      }}
      controlShouldRenderValue={false}
      classNames={{
        // copy-pasted and simplified from SelectFormField
        control: () =>
          "min-w-[12em] max-w-[12em] !min-h-0 h-8 cursor-pointer bg-slate-100 hover:bg-white focus-within:bg-white transition-colors border-slate-300 border rounded-full shadow-sm focus-within:ring-indigo-400 focus-within:ring-2",
        // disable default browser focus style
        input: () => "[&_input:focus]:!ring-transparent",
        placeholder: () => "text-slate-400 text-sm font-light",
        valueContainer: () => "px-3",
        clearIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        loadingIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        indicatorSeparator: () => "hidden",
        dropdownIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        menuPortal: () => "!z-[100]",
        // based on Dropdown styles
        menu: () =>
          "mt-2 min-w-[20em] rounded-md bg-white shadow-xl border border-slate-300 overflow-hidden",
        menuList: () => "p-1 overflow-auto",
        option: ({ isDisabled, isFocused }) =>
          clsx(
            "px-3 py-1.5 rounded text-slate-700",
            isFocused && "bg-blue-100",
            !isDisabled && "rounded hover:bg-blue-100 hover:text-slate-900"
          ),
        loadingMessage: () => "text-slate-500",
        noOptionsMessage: () => "text-slate-400 p-2",
      }}
    />
  );
};
