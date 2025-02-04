import textVersion from "textversionjs";

export default function toMarkdown(htmlText: string) {
  let html2 = htmlText.replaceAll(`='`, `="`).replaceAll(`'>`, `">`);
  return textVersion(html2, {
    linkProcess: (href, linkText) => {
      let newHref = href
        ? href.replace(/\(/g, "%28").replace(/\)/g, "%29")
        : "";
      // Deal correctly in markdown with links that contain parenthesis
      return `[${linkText}](${newHref})`;
    },
  });
}

// toMarkdown()
// console.log(toMarkdown("Context:Many intellectual endeavors require mathematical problem solving, but this skill remains beyond the capabilities of computers. To help advance the art, the <a target=_new href='https://github.com/hendrycks/math/'>MATH</a> dataset offers..."))
