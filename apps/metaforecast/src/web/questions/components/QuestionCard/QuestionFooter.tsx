import { FC } from "react";

import { QuestionFragment } from "../../../fragments.generated";
import { Stars } from "../Stars";

type QualityIndicator = QuestionFragment["qualityIndicators"];
type IndicatorName = keyof QualityIndicator;

// this duplication can probably be simplified with typescript magic, but this is good enough for now
export type UsedIndicatorName =
  // | "numForecasts"
  // | "stars"
  | "volume"
  | "numForecasters"
  | "spread"
  | "sharesVolume"
  | "liquidity"
  | "tradeVolume"
  | "openInterest";

export const qualityIndicatorLabels: { [k in UsedIndicatorName]: string } = {
  // numForecasts: "Number of forecasts",
  // stars: "Stars",
  // yesBid: "Yes bid",
  // yesAsk: "Yes ask",
  volume: "Volume",
  numForecasters: "Forecasters",
  spread: "Spread",
  sharesVolume: "Shares vol.",
  liquidity: "Liquidity",
  tradeVolume: "Volume",
  openInterest: "Interest",
};

const isUsedIndicatorName = (name: string): name is UsedIndicatorName => {
  return name in qualityIndicatorLabels;
};

const formatNumber = (num: number) => {
  if (num < 1000) {
    return num.toFixed(0);
  } else if (num < 10000) {
    return (num / 1000).toFixed(1) + "k";
  } else {
    return (num / 1000).toFixed(0) + "k";
  }
};

/* Display functions*/

const getPercentageSymbolIfNeeded = ({
  indicator,
  platform,
}: {
  indicator: UsedIndicatorName;
  platform: string;
}) => {
  const indicatorsWhichNeedPercentageSymbol: IndicatorName[] = ["spread"];
  if (indicatorsWhichNeedPercentageSymbol.includes(indicator)) {
    return "%";
  } else {
    return "";
  }
};

const getCurrencySymbolIfNeeded = ({
  indicator,
  platform,
}: {
  indicator: UsedIndicatorName;
  platform: string;
}) => {
  const indicatorsWhichNeedCurrencySymbol: IndicatorName[] = [
    "volume",
    "tradeVolume",
    "openInterest",
    "liquidity",
  ];
  let dollarPlatforms = ["predictit", "kalshi", "polymarket", "insight"];
  if (indicatorsWhichNeedCurrencySymbol.includes(indicator)) {
    if (dollarPlatforms.includes(platform)) {
      return "$";
    } else {
      return "£";
    }
  } else {
    return "";
  }
};

const FirstQualityIndicator: React.FC<{
  question: QuestionFragment;
}> = ({ question }) => {
  if (question.qualityIndicators.numForecasts) {
    return (
      <div className="flex">
        <span>Forecasts:</span>&nbsp;
        <span className="font-bold">
          {Number(question.qualityIndicators.numForecasts).toFixed(0)}
        </span>
      </div>
    );
  } else {
    return null;
  }
};

export const formatIndicatorValue = (
  value: number,
  indicator: UsedIndicatorName,
  platform: string
): string => {
  return `${getCurrencySymbolIfNeeded({
    indicator,
    platform: platform,
  })}${formatNumber(value)}${getPercentageSymbolIfNeeded({
    indicator,
    platform: platform,
  })}`;
};

const QualityIndicatorsList: FC<{
  question: QuestionFragment;
}> = ({ question }) => {
  return (
    <div className="text-sm">
      <FirstQualityIndicator question={question} />
      {Object.entries(question.qualityIndicators).map(
        ([indicator, value], i) => {
          if (!isUsedIndicatorName(indicator)) return;
          const indicatorLabel = qualityIndicatorLabels[indicator];
          if (!indicatorLabel || value === null) return;

          return (
            <div key={indicator}>
              <span>{indicatorLabel}:</span>&nbsp;
              <span className="font-bold">
                {formatIndicatorValue(
                  Number(value),
                  indicator,
                  question.platform.id
                )}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
};

export const QuestionFooter: FC<{
  question: QuestionFragment;
  expandFooterToFullWidth: boolean;
}> = ({ question, expandFooterToFullWidth }) => {
  return (
    <div
      className={`grid grid-cols-3 ${
        expandFooterToFullWidth ? "justify-between" : ""
      } text-gray-500`}
    >
      <div className="self-center">
        <Stars num={question.qualityIndicators.stars} />
      </div>
      <div
        className={`${
          expandFooterToFullWidth ? "place-self-center" : "self-center"
        }  col-span-1 font-bold`}
      >
        {question.platform.label
          .replace("Good Judgment Open", "GJOpen")
          .replace("Insight Prediction", "Insight")
          .replace(/ /g, "\u00a0")}
      </div>
      <div
        className={`${
          expandFooterToFullWidth
            ? "justify-self-end mr-4"
            : "justify-self-center"
        } col-span-1`}
      >
        <QualityIndicatorsList question={question} />
      </div>
    </div>
  );
};
