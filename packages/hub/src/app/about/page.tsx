import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import {
  DISCORD_URL,
  GITHUB_DISCUSSION_URL,
  GITHUB_URL,
  NEWSLETTER_URL,
  QURI_DONATE_URL,
} from "@/lib/common";
import { graphqlPlaygroundRoute } from "@/routes";

const markdown = `
# About Squiggle Hub
Squiggle Hub is a platform for the creation and sharing of code written in [Squiggle](https://www.squiggle-language.com/). Both the platform and the source code are [open-source](${GITHUB_URL}) and free to use.

## Squiggle: A Glimpse
Squiggle is a probabilistic estimation-oriented programming language that operates on the JavaScript platform. We think it's well-suited for intuition-based modeling and risk estimation. Additional details can be found on the [Squiggle official website](https://www.squiggle-language.com/).

## Our Connection to Guesstimate
Out team previously co-founded [Guesstimate](https://getguesstimate.com/), a different estimation tool. Squiggle Hub stands as a spiritual successor to Guesstimate. With the power of a full programming language at its disposal, it offers superior flexibility and power, albeit at the cost of a steeper learning curve.

## QURI & Squiggle Hub
Squiggle Hub is made by the [Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/) (QURI). QURI is a registered 501(c)(3) nonprofit devoted to the design and research of uncertainty quantification tools. We hope to use Squiggle Hub to aid effective nonprofits and funding bodies in making impactful decisions.

## Key Links
- [Squiggle](https://www.squiggle-language.com/)  
- [Squiggle API](${graphqlPlaygroundRoute()})  
- [Squiggle Discord](${DISCORD_URL})  
- [Squiggle Github](${GITHUB_URL})  
- [Squiggle Github Discussion (For Ideas and Issues)](${GITHUB_DISCUSSION_URL})  
- [Squiggle Newsletter (Part of the QURI Newsletter)](${NEWSLETTER_URL})

## Licensing
Squiggle Hub, along with Squiggle, is available for free use, with the code being open-source and licensed under MIT. Access it [here](https://github.com/quantified-uncertainty/squiggle).

## Squiggle Hub API
Developed using a GraphQL API, Squiggle Hub can be accessed [here](${graphqlPlaygroundRoute()}). The API is recommended for querying. If you want to run mutations, reach out to us via [Discord](${DISCORD_URL}). Squiggle's JavaScript implementation is available on [NPM](https://www.npmjs.com/package/squiggle-lang). There are several [integrations](https://www.squiggle-language.com/docs/Integrations) like VS Code and Observable.

## Feature: Relative Values
Squiggle Hub currently supports experimental [relative values](https://forum.effectivealtruism.org/posts/EFEwBvuDrTLDndqCt/relative-value-functions-a-flexible-new-format-for-value), with future improvements planned.

## Future Developments

We are planning to add numerous features. This includes:

- Models can import code from other models
  - Note: Even though you can’t formally import code now, you can still copy & paste code from other files. 
- Multi-file models
- Private models
- Simple support for years and dates
- Integration with apps such as Google Sheets, Guesstimate, Github, and more
- Better support for presenting / describing models

For input on these or any other features, please connect with us on [Discord](${DISCORD_URL}) or through the [Github Discussion](${GITHUB_DISCUSSION_URL}).

## Donations
Support our endeavor to develop Squiggle and Squiggle Hub by donating to QURI [here](${QURI_DONATE_URL}). Your donations are tax-deductible in the United States. We rely on private donors for continued development and support.
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

export const metadata: Metadata = {
  title: "About",
};
