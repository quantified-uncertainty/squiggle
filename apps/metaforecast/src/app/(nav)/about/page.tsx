import React from "react";

import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

import { Card } from "../../../web/common/Card";

const readmeMarkdownText = `# About

This webpage is a search engine for probabilities. Given a query, it searches for relevant questions in various prediction markets and forecasting platforms. For example, try searching for "China", "North Korea", "Semiconductors", "COVID", "Trump", or "X-risk". In addition to search, we also provide various [tools](http://metaforecast.org/tools).

We are very interested in integrating Metaforecast with other services, and the whole thing is [open source](https://github.com/QURIresearch/metaforecast). So far, Metaforecast has been integrated with [Twitter](https://twitter.com/NunoSempere/status/1433160907308294144), [Fletcher](https://fletcher.fun/), [GlobalGuessing](https://globalguessing.com/russia-ukraine-forecasts/) and previously [Elicit](https://elicit.org/).

You can read a longer writeup with thoughts and motivations [here](https://forum.effectivealtruism.org/posts/tEo5oXeSNcB3sYr8m/introducing-metaforecast-a-forecast-aggregator-and-search), and an update thereto [here](https://www.lesswrong.com/posts/5hugQzRhdGYc6ParJ/metaforecast-update-better-search-capture-functionality-more).

## Advanced search
If your initial search doesn't succeed, you might want to try tinkering with the advanced search. In particular, try increasing or decreasing the stars threshold, or changing the number of search results shown. 

## What are stars, and how are they computed?

Star ratings—e.g. ★★★☆☆—are an indicator of the quality of an aggregate forecast for a question. These ratings currently try to reflect my own best judgment and the best judgment of forecasting experts I've asked, based on our collective experience forecasting on these platforms. Thus, stars have a strong subjective component which could be formalized and refined in the future. You can see the code used to decide how many stars to assign according to platform and various quality indicators [here](https://github.com/QURIresearch/metaforecast/blob/master/src/utils/stars.js)

Also note that, whatever other redeeming features they might have, prediction markets rarely go above 95% or below 5%.

## Who is behind this?
[Nuño Sempere](https://nunosempere.github.io), with help from Ozzie Gooen, from the [Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/). We both have several other forecasting-related projects, but one which might be particularly worth highlighting is this [forecasting newsletter](http://forecasting.substack.com/).

`;

export default function AboutPage() {
  return (
    <Card highlightOnHover={false} large={true}>
      <ReactMarkdown
        remarkPlugins={[gfm]}
        children={readmeMarkdownText}
        className="max-w-prose mx-auto"
      />
    </Card>
  );
}
