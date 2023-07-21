import ReactMarkdown from "react-markdown";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import remarkGfm from "remark-gfm";
import {
  GITHUB_URL,
  GITHUB_DISCUSSION_URL,
  DISCORD_URL,
  GRAPHQL_URL,
  NEWSLETTER_URL,
  QURI_DONATE_URL,
} from "@/lib/common";

const markdown = `
# Overview
Squiggle Hub serves as a communal platform for the creation and sharing of code written in [Squiggle](https://www.squiggle-language.com/). Both the platform and the source code are open-source and free to use.

## Squiggle: A Glimpse
[Squiggle](https://www.squiggle-language.com/) is a probabilistic estimation-oriented programming language that operates on the JavaScript platform. We think it's well-suited for intuition-based modeling and risk estimation. Additional details can be found on the Squiggle official website.

## Our Connection to Guesstimate
Out team previously co-founded [Guesstimate](https://getguesstimate.com/), a different estimation tool. Squiggle Hub stands as a spiritual successor to Guesstimate. With the power of a full programming language at its disposal, it offers superior flexibility and power, albeit at the cost of a steeper learning curve.

## QURI & Squiggle Hub
The [Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/), or QURI, is the proud creator of Squiggle Hub. As a registered 501(c)(3) nonprofit, QURI is devoted to the design and research of uncertainty quantification tools. Our ambition is for Squiggle Hub to aid effective nonprofits and funding bodies in making impactful decisions.

## Essential Links
- [Squiggle](https://www.squiggle-language.com/)  
- [Squiggle API](${GRAPHQL_URL})  
- [Squiggle Discord](${DISCORD_URL})  
- [Squiggle Github](${GITHUB_URL})  
- [Squiggle Github Discussion (For Ideas and Issues)](${GITHUB_DISCUSSION_URL})  
- [Squiggle Newsletter (Part of the QURI Newsletter)](${NEWSLETTER_URL})

## Licensing
Squiggle Hub, along with Squiggle, is available for free use, with the code being open-source and licensed under MIT. Access it [here](https://github.com/quantified-uncertainty/squiggle).

## Squiggle Hub API
Developed using a GraphQL API, Squiggle Hub can be accessed [here](${GRAPHQL_URL}). The API is recommended for querying. If mutations are desired, kindly reach out to us via Discord. Squiggle's JavaScript implementation is available on [NPM](https://www.npmjs.com/package/squiggle-lang), and it includes several [integrations](https://www.squiggle-language.com/docs/Integrations) like VSCode and Observable.

## Feature: Relative Values
Squiggle Hub currently supports experimental [relative values](https://forum.effectivealtruism.org/posts/EFEwBvuDrTLDndqCt/relative-value-functions-a-flexible-new-format-for-value), with future improvements planned.

## Future Developments
Though Squiggle Hub is in its early stages, we envision the addition of numerous features, such as private models, multi-file models, code interchange between models, notebook-style interfaces, time-series data and time function support, function forecasting, integration with Google Sheets, Guesstimate, LLMs, Github, and more. The prospect of calling model functions directly from the API is also on the horizon. For input on these or any other features, please connect with us on [Discord](${DISCORD_URL}) or through the [Github Discussion](${GITHUB_DISCUSSION_URL}).

## Donations
Support our endeavor to develop Squiggle and Squiggle Hub by donating to QURI [here](${QURI_DONATE_URL}). Your contributions help maintain the continuity of our projects.
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
