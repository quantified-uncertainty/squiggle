import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { source } from "@/app/source";

function docsPathToGitHub(path: string) {
  return {
    owner: "quantified-uncertainty",
    repo: "squiggle",
    sha: "main",
    path: `packages/website/content/docs/${path}`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{
        style: "clerk",
      }}
      editOnGithub={docsPathToGitHub(page.file.path)}
      full={page.data.full}
    >
      <DocsTitle>{page.data.title || page.file.name}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={{
            /*
             * Note that default components includes `Callout` but not `Tabs`.
             * See https://fumadocs.vercel.app/docs/ui/components for the full list of components.
             */
            ...defaultMdxComponents,
            // https://fumadocs.vercel.app/docs/ui/mdx/codeblock#usage
            pre: ({ ref: _ref, ...props }) => (
              <CodeBlock {...props}>
                <Pre>{props.children}</Pre>
              </CodeBlock>
            ),
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) notFound();

  return {
    title: `${page.data.title} | Squiggle`,
    description: page.data.description,
    openGraph: {
      title: `${page.data.title} | Squiggle`,
      description: page.data.description,
    },
  } satisfies Metadata;
}
