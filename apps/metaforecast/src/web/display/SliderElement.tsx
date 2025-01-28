import { FC, useState } from "react";

import {
  GetHandleProps,
  GetTrackProps,
  Handles,
  Rail,
  Slider,
  SliderItem,
  Tracks,
} from "react-compound-slider";

// https://sghall.github.io/react-compound-slider/#/getting-started/tutorial

/* Definitions */

const sliderStyle = {
  // Give the slider some width
  position: "relative",
  width: "11em",
  height: 40,
  border: "5em",
};

const railStyle = {
  position: "absolute",
  width: "100%",
  height: 5,
  marginTop: 30,
  borderRadius: 5,
  backgroundColor: "lightgrey",
};

/* Support functions */
const Handle: FC<{
  handle: SliderItem;
  getHandleProps: GetHandleProps;
  displayFunction: (value: number) => string;
}> = ({ handle: { id, value, percent }, getHandleProps, displayFunction }) => {
  return (
    <>
      <div className="justify-center text-center text-gray-600 text-xs">
        {displayFunction(value)}
      </div>
      <div
        style={{
          left: `${percent}%`,
          position: "absolute",
          marginLeft: -10,
          marginTop: 10,
          zIndex: 2,
          width: 15,
          height: 15,
          cursor: "pointer",
          borderRadius: "50%",
          backgroundColor: "#374151",
          color: "#374151",
        }}
        {...getHandleProps(id)}
      ></div>
    </>
  );
};

const Track: FC<{
  source: SliderItem;
  target: SliderItem;
  getTrackProps: GetTrackProps;
}> = ({ source, target, getTrackProps }) => {
  return (
    <div
      style={{
        position: "absolute",
        height: 5,
        zIndex: 1,
        marginTop: 15,
        backgroundColor: "#546C91",
        borderRadius: 5,
        cursor: "pointer",
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {
        ...getTrackProps() /* this will set up events if you want it to be clickeable (optional) */
      }
    />
  );
};

type Props = {
  defaultValue: number;
  onChange: (value: number) => void;
  displayFunction: (value: number) => string;
};

/* Body */
export const SliderElement: FC<Props> = ({
  onChange,
  defaultValue,
  displayFunction,
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <Slider
      rootStyle={
        sliderStyle /* inline styles for the outer div. Can also use className prop. */
      }
      domain={[0, 200]}
      values={[value]}
      onChange={(values) => {
        setValue(values[0]);
        onChange(values[0]);
      }}
    >
      <Rail>
        {({ getRailProps }) => <div style={railStyle} {...getRailProps()} />}
      </Rail>
      <Handles>
        {({ handles, getHandleProps }) => (
          <div>
            {handles.map((handle) => (
              <Handle
                key={handle.id}
                handle={handle}
                getHandleProps={getHandleProps}
                displayFunction={displayFunction}
              />
            ))}
          </div>
        )}
      </Handles>
      <Tracks right={false}>
        {({ tracks, getTrackProps }) => (
          <div>
            {tracks.map(({ id, source, target }) => (
              <Track
                key={id}
                source={source}
                target={target}
                getTrackProps={getTrackProps}
              />
            ))}
          </div>
        )}
      </Tracks>
    </Slider>
  );
};
