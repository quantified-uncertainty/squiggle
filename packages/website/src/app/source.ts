import { createMDXSource } from "@fumadocs/content-collections";
// "content-collections" is aliased to .content-collections/generated in tsconfig.json
// This is a standard practice, see https://fumadocs.vercel.app/docs/headless/content-collections#setup
import { allApiDocs, allDocs, allMetas } from "content-collections";
import { loader } from "fumadocs-core/source";

const mdxSource = createMDXSource(
  [
    ...allDocs,
    ...allApiDocs.map((doc) => ({
      ...doc,
      _meta: {
        ...doc._meta,
        filePath: `API/${doc._meta.filePath}`,
        directory: "API",
        path: `API/${doc._meta.path}`,
      },
    })),
  ],
  [
    ...allMetas,
    {
      title: "API",
      pages: allApiDocs.map((doc) => doc.title),
      _meta: {
        filePath: "API/meta.json",
        fileName: "meta.json",
        directory: "API",
        extension: "json",
        path: "API/meta",
      },
    },
  ]
);

export const source = loader({
  baseUrl: "/docs",
  source: mdxSource,
});
