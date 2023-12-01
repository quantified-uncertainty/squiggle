import { FC, useEffect } from "react";
import { graphql, useQueryLoader } from "react-relay";
import { FormProvider, useForm } from "react-hook-form";
import { usePathname } from "next/navigation";

import { TextFormField } from "@quri/ui";

import { GlobalSearchQuery } from "@/__generated__/GlobalSearchQuery.graphql";
import { SearchResults } from "./SearchResults";

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
            object {
              ...SearchResult
            }
          }
        }
      }
    }
  }
`;

export const GlobalSearch: FC = () => {
  const [queryRef, loadQuery, disposeQuery] =
    useQueryLoader<GlobalSearchQuery>(Query);

  const pathname = usePathname();

  useEffect(() => {
    disposeQuery();
  }, [pathname, disposeQuery]);

  type FormShape = {
    text: string;
  };
  const form = useForm<FormShape>();

  const submit = form.handleSubmit(({ text }) => {
    loadQuery({
      text,
    });
  });

  useEffect(() => {
    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [submit, form, form.watch]);

  return (
    <FormProvider {...form}>
      <div className="relative">
        <TextFormField<FormShape> name="text" size="small" />

        {queryRef ? (
          <div className="absolute rounded bg-white border right-0 mt-2 shadow-xl min-w-[12em]">
            <SearchResults queryRef={queryRef} />
          </div>
        ) : null}
      </div>
    </FormProvider>
  );
};
