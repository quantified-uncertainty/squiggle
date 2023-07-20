import ReactMarkdown from "react-markdown";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import remarkGfm from "remark-gfm";

const markdown = `
# About
Squiggle Hub is a platform for people to write and share [Squiggle](https://www.squiggle-language.com/) code. The platform is free to use and is open source.

## Background
### Squiggle
Squiggle is a programming language for probablistic estimations that's build on Javascript. You can read more about it on the [Squiggle website](https://www.squiggle-language.com/).

### Connections to Guesstimate
Our team members previously cofounded [Guesstimate](https://getguesstimate.com/), a tool for making estimations. Squiggle Hub is a spiritual successor to Guesstimate. Being based on a progamming language, it is significantly more powerful and flexible than Guesstimate, though it has a steeper learning curve.

### QURI
Squiggle Hub is made by the [Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/). QURI is a 501(c)(3) nonprofit organization dedicated to the research and development of tools for quantifying uncertainty. We hope that Squiggle Hub will be used by effective nonprofits and funders to help make decisions that maximize their impacts.

## Key Links
- [Squiggle](https://www.squiggle-language.com/)
- [Squiggle API](https://squigglehub.org/api/graphql)
- [Squiggle Discord](https://discord.gg/nsTnQTgtG)
- [Squiggle Github](https://github.com/quantified-uncertainty/squiggle)
- [Squiggle Github Discussion, for Ideas and Issues](https://github.com/quantified-uncertainty/squiggle/discussions)
- [Squiggle Newsletter (Part of the QURI Newsletter)](https://quri.substack.com/t/squiggle)

## Code License
Squiggle Hub is free to use. All of the code for both Squiggle Hub and Squiggle is open source, MIT-licensed, and available on [Github](https://github.com/quantified-uncertainty/squiggle).

## API
Squiggle Hub is made using a GraphQL API. You can access it [here](https://squigglehub.org/api/graphql). The API will likely change in the future. This is useful for querying, but if you would like to use it for mutations, please contact us in the Discord. 

Squiggle code itself is implemented in Javascript and accessible with on [NPM](https://www.npmjs.com/package/squiggle-lang). It features several [integrations](https://www.squiggle-language.com/docs/Integrations), including with VSCode and Observable.

## Relative Values
Squiggle Hub has experimental support for [relative values](https://forum.effectivealtruism.org/posts/EFEwBvuDrTLDndqCt/relative-value-functions-a-flexible-new-format-for-value). This will be improved in the future.

## Possible Future Features
Squiggle Hub is still an early platform. Some ideas we have for the future include:  
- Private models and organizations
- Models with multiple files
- Code import/export between models
- Notebook-style interfaces
- Support for time functions and time series data
- Function forecasting
- Integration with Google Sheets, Guesstimate, LLMs, Github, and more
- Model functions can be called directly from the API

If you have thoughts on these or other features, please let us know in the [Discord](https://discord.gg/nsTnQTgtG) or [Github Discussion](https://github.com/quantified-uncertainty/squiggle/discussion)!

## Donations
If you'd like to support the development of Squiggle and Squiggle Hub, you can donate to QURI [here](https://quantifieduncertainty.org/donate). We rely on donors like you to keep our projects running.

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
