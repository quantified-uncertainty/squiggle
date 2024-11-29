import { z } from "zod";

const searchResultObjectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Model"),
    slug: z.string(),
    owner: z.string(),
  }),
  z.object({
    type: z.literal("RelativeValuesDefinition"),
    slug: z.string(),
    owner: z.string(),
  }),
  z.object({
    type: z.literal("User"),
    slug: z.string(),
  }),
  z.object({
    type: z.literal("Group"),
    slug: z.string(),
  }),
]);

export const searchResultSchema = z.array(
  z.object({
    id: z.string(),
    link: z.string(),
    slugSnippet: z.string(),
    textSnippet: z.string(),
    object: searchResultObjectSchema,
  })
);

export type SearchResult = z.infer<typeof searchResultSchema>;

export type SearchResultItem = SearchResult[number];

export type TypedSearchResultItem<
  T extends SearchResultItem["object"]["type"],
> = SearchResultItem & {
  object: Extract<SearchResultItem["object"], { type: T }>;
};
