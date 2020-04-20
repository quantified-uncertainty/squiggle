type chartConfig = {
  xLog: bool,
  yLog: bool,
  isCumulative: bool,
  height: int,
};

type state = {
  showStats: bool,
  showPercentiles: bool,
  showParams: bool,
  distributions: list(chartConfig),
};

type action =
  | CHANGE_SHOW_STATS
  | CHANGE_SHOW_PARAMS
  | CHANGE_SHOW_PERCENTILES
  | REMOVE_DIST(int)
  | ADD_DIST
  | CHANGE_X_LOG(int)
  | CHANGE_Y_LOG(int)
  | CHANGE_IS_CUMULATIVE(int, bool)
  | HEIGHT_INCREMENT(int)
  | HEIGHT_DECREMENT(int);

let changeHeight = (currentHeight, foo: [ | `increment | `decrement]) =>
  switch (currentHeight, foo) {
  | (1, `decrement) => 1
  | (2, `decrement) => 1
  | (3, `decrement) => 2
  | (4, `decrement) => 3
  | (5, `decrement) => 4
  | (1, `increment) => 2
  | (2, `increment) => 3
  | (3, `increment) => 4
  | (4, `increment) => 5
  | (5, `increment) => 5
  | _ => 1
  };

let heightToPix =
  fun
  | 1 => 80
  | 2 => 140
  | 3 => 240
  | 4 => 340
  | 5 => 440
  | _ => 140;

let distributionReducer = (index, state: list(chartConfig), action) => {
  switch (action, E.L.get(state, index)) {
  | (HEIGHT_INCREMENT(_), Some(dist)) =>
    E.L.update(
      {...dist, height: changeHeight(dist.height, `increment)},
      index,
      state,
    )
  | (HEIGHT_DECREMENT(_), Some(dist)) =>
    E.L.update(
      {...dist, height: changeHeight(dist.height, `decrement)},
      index,
      state,
    )
  | (CHANGE_IS_CUMULATIVE(_, isCumulative), Some(dist)) =>
    E.L.update({...dist, isCumulative}, index, state)
  | (CHANGE_X_LOG(_), Some(dist)) =>
    E.L.update({...dist, xLog: !dist.xLog}, index, state)
  | (CHANGE_Y_LOG(_), Some(dist)) =>
    E.L.update({...dist, yLog: !dist.yLog}, index, state)
  | (REMOVE_DIST(_), Some(_)) => E.L.remove(index, 1, state)
  | (ADD_DIST, Some(_)) =>
    E.L.append(
      state,
      [{yLog: false, xLog: false, isCumulative: false, height: 4}],
    )
  | _ => state
  };
};

let reducer = (state: state, action: action) =>
  switch (action) {
  | CHANGE_X_LOG(i)
  | CHANGE_Y_LOG(i)
  | CHANGE_IS_CUMULATIVE(i, _)
  | HEIGHT_DECREMENT(i)
  | REMOVE_DIST(i)
  | HEIGHT_INCREMENT(i) => {
      ...state,
      distributions: distributionReducer(i, state.distributions, action),
    }
  | ADD_DIST => {
      ...state,
      distributions: distributionReducer(0, state.distributions, action),
    }
  | CHANGE_SHOW_STATS => {...state, showStats: !state.showStats}
  | CHANGE_SHOW_PARAMS => {...state, showParams: !state.showParams}
  | CHANGE_SHOW_PERCENTILES => {
      ...state,
      showPercentiles: !state.showPercentiles,
    }
  };

let init = {
  showStats: false,
  showParams: false,
  showPercentiles: true,
  distributions: [
    {yLog: false, xLog: false, isCumulative: false, height: 4},
    {yLog: false, xLog: false, isCumulative: true, height: 1},
  ],
};