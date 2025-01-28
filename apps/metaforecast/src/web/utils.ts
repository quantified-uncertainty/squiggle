import { QuestionFragment } from "./fragments.generated";

export const getBasePath = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://metaforecast.org`;//`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // can be used for local development if you prefer non-default port
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "http://localhost:3000";
};

export const cleanText = (text: string): string => {
  // TODO - move to GraphQL:
  // { description(clean: true, truncate: 250) }
  let textString = !!text ? text : "";
  textString = textString
    .replaceAll("] (", "](")
    .replaceAll(") )", "))")
    .replaceAll("( [", "([")
    .replaceAll(") ,", "),")
    .replaceAll("==", "") // Denotes a title in markdown
    .replaceAll(/^#+\s+/gm, "")
    .replaceAll(/^Background\n/gm, "")
    .replaceAll(/^Context\n/gm, "")
    .replaceAll("--- \n", "- ")
    .replaceAll(/\[(.*?)\]\(.*?\)/g, "$1");
  textString = textString.slice(0, 1) == "=" ? textString.slice(1) : textString;

  return textString;
};

export const isQuestionBinary = (question: QuestionFragment): boolean => {
  const { options } = question;
  return (
    options.length === 2 &&
    ((options[0].name === "Yes" && options[1].name === "No") ||
      (options[0].name === "No" && options[1].name === "Yes"))
  );
};
