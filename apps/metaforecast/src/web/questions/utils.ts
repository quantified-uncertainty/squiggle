export const formatProbability = (probability: number) => {
  let percentage = probability * 100;
  let percentageCapped =
    percentage < 1
      ? "< 1%"
      : percentage > 99
      ? "> 99%"
      : percentage.toFixed(0) + "%";
  return percentageCapped;
};
