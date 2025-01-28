import { height, width } from "./utils";

export const InnerChartPlaceholder: React.FC = () => {
  return (
    <svg
      width={width}
      height={height}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
