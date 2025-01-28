import { FullQuestionOption, isFullQuestionOption } from "../../../common/types";
import { QuestionFragment } from "../../fragments.generated";
import { isQuestionBinary } from "../../utils";
import { formatProbability } from "../utils";

const textColor = (probability: number) => {
  if (probability < 0.03) {
    return "text-red-600";
  } else if (probability < 0.1) {
    return "text-red-600 opacity-80";
  } else if (probability < 0.2) {
    return "text-red-600 opacity-80";
  } else if (probability < 0.3) {
    return "text-red-600 opacity-70";
  } else if (probability < 0.4) {
    return "text-red-600 opacity-70";
  } else if (probability < 0.5) {
    return "text-gray-500";
  } else if (probability < 0.6) {
    return "text-gray-500";
  } else if (probability < 0.7) {
    return "text-green-600 opacity-70";
  } else if (probability < 0.8) {
    return "text-green-600 opacity-70";
  } else if (probability < 0.9) {
    return "text-green-600 opacity-80";
  } else if (probability < 0.97) {
    return "text-green-600 opacity-80";
  } else {
    return "text-green-600";
  }
};

const primaryForecastColor = (probability: number) => {
  if (probability < 0.03) {
    return "bg-red-600";
  } else if (probability < 0.1) {
    return "bg-red-600 opacity-80";
  } else if (probability < 0.2) {
    return "bg-red-600 opacity-70";
  } else if (probability < 0.3) {
    return "bg-red-600 opacity-60";
  } else if (probability < 0.4) {
    return "bg-red-600 opacity-50";
  } else if (probability < 0.5) {
    return "bg-gray-500";
  } else if (probability < 0.6) {
    return "bg-gray-500";
  } else if (probability < 0.7) {
    return "bg-green-600 opacity-50";
  } else if (probability < 0.8) {
    return "bg-green-600 opacity-60";
  } else if (probability < 0.9) {
    return "bg-green-600 opacity-70";
  } else if (probability < 0.97) {
    return "bg-green-600 opacity-80";
  } else {
    return "bg-green-600";
  }
};

const chooseColor = (probability: number) => {
  if (probability < 0.1) {
    return "bg-blue-50 text-blue-500";
  } else if (probability < 0.3) {
    return "bg-blue-100 text-blue-600";
  } else if (probability < 0.7) {
    return "bg-blue-200 text-blue-700";
  } else {
    return "bg-blue-300 text-blue-800";
  }
};

const primaryEstimateAsText = (probability: number) => {
  if (probability < 0.03) {
    return "Exceptionally unlikely";
  } else if (probability < 0.1) {
    return "Very unlikely";
  } else if (probability < 0.4) {
    return "Unlikely";
  } else if (probability < 0.6) {
    return "About Even";
  } else if (probability < 0.9) {
    return "Likely";
  } else if (probability < 0.97) {
    return "Very likely";
  } else {
    return "Virtually certain";
  }
};

type OptionProps = {
  option: FullQuestionOption;
  mode: "primary" | "normal"; // affects font size and colors
  textMode: "name" | "probability"; // whether to output option name or probability estimate as text
};

const OptionRow: React.FC<OptionProps> = ({ option, mode, textMode }) => {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`flex-none rounded-md text-center ${
          mode === "primary"
            ? "text-sm md:text-lg text-normal text-white px-2 py-0.5 font-bold"
            : "text-sm w-14 py-0.5"
        } ${
          mode === "primary"
            ? primaryForecastColor(option.probability)
            : chooseColor(option.probability)
        }`}
      >
        {formatProbability(option.probability)}
      </div>
      <div
        className={`leading-snug ${
          mode === "primary" ? "text-sm md:text-lg text-normal" : "text-sm"
        } ${
          mode === "primary" ? textColor(option.probability) : "text-gray-700"
        }`}
      >
        {textMode === "name"
          ? option.name
          : primaryEstimateAsText(option.probability)}
      </div>
    </div>
  );
};

export const QuestionOptions: React.FC<{
  question: QuestionFragment;
  maxNumOptions: number;
  forcePrimaryMode?: boolean;
}> = ({ question, maxNumOptions, forcePrimaryMode = false }) => {
  const isBinary = isQuestionBinary(question);

  if (isBinary) {
    const yesOption = question.options.find((o) => o.name === "Yes");
    if (!yesOption) {
      return null; // shouldn't happen
    }
    if (!isFullQuestionOption(yesOption)) {
      return null; // missing data
    }

    return (
      <OptionRow option={yesOption} mode="primary" textMode="probability" />
    );
  } else {
    const optionsSorted = question.options
      .filter(isFullQuestionOption)
      .sort((a, b) => b.probability - a.probability);

    const optionsMaxN = optionsSorted.slice(0, maxNumOptions); // display max 5 options.

    return (
      <div className="space-y-2">
        {optionsMaxN.map((option, i) => (
          <OptionRow
            key={i}
            option={option}
            mode={forcePrimaryMode ? "primary" : "normal"}
            textMode="name"
          />
        ))}
      </div>
    );
  }
};
