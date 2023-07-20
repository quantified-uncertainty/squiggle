import ReactMarkdown from "react-markdown";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import remarkGfm from "remark-gfm";

const markdown = `
# About

Squiggle Hub is a platform for people to write and share [Squiggle](https://www.squiggle-language.com/) code. Squiggle Hub is free to use.

## Squiggle

Squiggle is a programming language for probablistic estimations that's build on Javascript. You can read more about it on the [Squiggle website](https://www.squiggle-language.com/).

## Connections to Guesstimate

Our team members previously cofounded [Guesstimate](https://getguesstimate.com/), a tool for making estimations. Squiggle Hub is a spiritual successor to Guesstimate. Being based on a progamming language, it is significantly more powerful and flexible than Guesstimate, though it has a steeper learning curve.

## QURI

Squiggle Hub is made by the [Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/). QURI is a 501(c)(3) nonprofit organization dedicated to the research and development of tools for quantifying uncertainty. We hope that Squiggle Hub will be used by effective nonprofits and funders to help make decisions that maximize their impacts.

## Donations

If you'd like to support the development of Squiggle Hub, you can donate to QURI [here](https://quantifieduncertainty.org/donate). We rely on donors like you to keep our projects running.

`;

export default function About() {
  return (
    <NarrowPageLayout>
      <ReactMarkdown className="prose max-w-4xl" remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </NarrowPageLayout>
  );
}
