module Types = {
  type rectangle = {
    // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
    left: int,
    top: int,
    right: int,
    bottom: int,
    x: int,
    y: int,
    width: int,
    height: int,
  };

  type webapi = Webapi.Canvas.Canvas2d.t;

  type xyShape = DistTypes.xyShape; /* {
    xs: array(float),
    ys: array(float),
  };*/

  type continuousShape = DistTypes.continuousShape; /*{
    xyShape,
    interpolation: [ | `Stepwise | `Linear],
  };*/

  type canvasPoint = {
    w: float,
    h: float,
  };

  type canvasShape = {
    ws: array(float),
    hs: array(float),
    xValues: array(float),
  };

  type foretoldFormElements = {
    measurableId: string,
    token: string,
    comment: string,
  };

  type distributionLimits = {
    lower: float,
    upper: float,
  };

  type canvasState = {
    canvasShape: option(canvasShape),
    lastMousePosition: option(canvasPoint),
    isMouseDown: bool,
    readyToRender: bool,
    hasJustBeenSentToForetold: bool,
    limitsHaveJustBeenUpdated: bool,
    foretoldFormElements,
    distributionLimits,
  };
};

module CanvasContext = {
  type t = Types.webapi;

  /* Externals */
  [@bs.send]
  external getBoundingClientRect: Dom.element => Types.rectangle =
    "getBoundingClientRect";
  [@bs.send] external setLineDash: (t, array(int)) => unit = "setLineDash";

  /* Webapi functions */
  // Ref: https://github.com/reasonml-community/bs-webapi-incubator/blob/master/src/Webapi/Webapi__Canvas/Webapi__Canvas__Canvas2d.re
  let getContext2d: Dom.element => t = Webapi.Canvas.CanvasElement.getContext2d;
  module Canvas2d = Webapi.Canvas.Canvas2d;
  let clearRect = Canvas2d.clearRect;
  let setFillStyle = Canvas2d.setFillStyle;
  let fillRect = Canvas2d.fillRect;
  let beginPath = Canvas2d.beginPath;
  let closePath = Canvas2d.closePath;
  let setStrokeStyle = Canvas2d.setStrokeStyle;
  let lineWidth = Canvas2d.lineWidth;
  let moveTo = Canvas2d.moveTo;
  let lineTo = Canvas2d.lineTo;
  let stroke = Canvas2d.stroke;
  let font = Canvas2d.font;
  let textAlign = Canvas2d.textAlign;
  let strokeText = Canvas2d.strokeText;
  let fillText = Canvas2d.fillText;

  /* Padding */
  let paddingRatioX = 0.9;
  let paddingRatioY = 0.9;

  let paddingFactorX = (rectangleWidth: int) =>
    (1. -. paddingRatioX) *. float_of_int(rectangleWidth) /. 2.0;
  let paddingFactorY = (rectangleHeight: int) =>
    (1. -. paddingRatioY) *. float_of_int(rectangleHeight) /. 2.0;

  let translatePointToInside = (canvasElement: Dom.element) => {
    let rectangle: Types.rectangle = getBoundingClientRect(canvasElement);
    let translate = (p: Types.canvasPoint): Types.canvasPoint => {
      let w = p.w -. float_of_int(rectangle.x);
      let h = p.h -. float_of_int(rectangle.y);
      {w, h};
    };
    translate;
  };
};

module Convert = {
  /*
   - In this module, the fundamental unit for the canvas shape is the distance vector from the (0,0) point at the upper leftmost corner of the screen.
     - For some drawing functions, this is instead from the (0,0) point at the upper leftmost corner of the canvas element. This is irrelevant in this module.
   - The fundamental unit for a probability distribution is an x coordinate and its corresponding y probability density
   */

  let xyShapeToCanvasShape =
      (~xyShape: Types.xyShape, ~canvasElement: Dom.element) => {
    let xs = xyShape.xs;
    let ys = xyShape.ys;
    let rectangle: Types.rectangle =
      CanvasContext.getBoundingClientRect(canvasElement);
    let lengthX = E.A.length(xs);

    let minX = xs[0];
    let maxX = xs[lengthX - 1];
    let ratioXs =
      float_of_int(rectangle.width)
      *. CanvasContext.paddingRatioX
      /. (maxX -. minX);
    let ws =
      E.A.fmap(
        x =>
          (x -. minX)
          *. ratioXs
          +. float_of_int(rectangle.left)
          +. (1. -. CanvasContext.paddingRatioX)
          *. float_of_int(rectangle.width)
          /. 2.0,
        xs,
      );

    let minY = 0.;
    let maxY = E.A.reduce(ys, 0., (x, y) => x > y ? x : y);
    let ratioYs =
      float_of_int(rectangle.height)
      *. CanvasContext.paddingRatioY
      /. (maxY -. minY);
    let hs =
      E.A.fmap(
        y =>
          float_of_int(rectangle.bottom)
          -. y
          *. ratioYs
          -. CanvasContext.paddingFactorY(rectangle.height),
        ys,
      );

    let canvasShape: Types.canvasShape = {ws, hs, xValues: xs};
    canvasShape;
  };

  let canvasShapeToContinuousShape =
      (~canvasShape: Types.canvasShape, ~canvasElement: Dom.element)
      : Types.continuousShape => {
    let xs = canvasShape.xValues;
    let hs = canvasShape.hs;
    let rectangle: Types.rectangle =
      CanvasContext.getBoundingClientRect(canvasElement);
    let bottom = float_of_int(rectangle.bottom);

    let ysRelative =
      E.A.fmap(
        h => bottom -. h +. CanvasContext.paddingFactorY(rectangle.height),
        hs,
      );
    let xyShape: Types.xyShape = {xs, ys: ysRelative};
    let continuousShape: Types.continuousShape = {
      xyShape,
      interpolation: `Linear,
    };
    let integral = XYShape.Analysis.integrateContinuousShape(continuousShape);
    let ys = E.A.fmap(y => y /. integral, ysRelative);
    let continuousShape: Types.continuousShape = {
      xyShape: {
        xs,
        ys,
      },
      interpolation: `Linear,
    };
    continuousShape;
  };

  /* Misc helper functions */
  let log2 = x => log(x) /. log(2.0);
  let findClosestInOrderedArrayDangerously = (x: float, xs: array(float)) => {
    let l = Array.length(xs);
    let a = ref(0);
    let b = ref(l - 1);
    let numSteps = int_of_float(log2(float_of_int(l))) + 1;
    for (_ in 0 to numSteps) {
      let c = (a^ + b^) / 2;
      xs[c] > x ? b := c : a := c;
    };
    b^;
  };
  let getPoint = (canvasShape: Types.canvasShape, n: int): Types.canvasPoint => {
    let point: Types.canvasPoint = {
      w: canvasShape.ws[n],
      h: canvasShape.hs[n],
    };
    point;
  };
};

module Draw = {
  let line =
      (
        canvasElement: Dom.element,
        ~point0: Types.canvasPoint,
        ~point1: Types.canvasPoint,
      )
      : unit => {
    let translator = CanvasContext.translatePointToInside(canvasElement);
    let point0 = translator(point0);
    let point1 = translator(point1);

    let context = CanvasContext.getContext2d(canvasElement);
    CanvasContext.beginPath(context);
    CanvasContext.moveTo(context, ~x=point0.w, ~y=point0.h);
    CanvasContext.lineTo(context, ~x=point1.w, ~y=point1.h);
    CanvasContext.stroke(context);
  };

  let canvasPlot =
      (canvasElement: Dom.element, canvasShape: Types.canvasShape) => {
    let context = CanvasContext.getContext2d(canvasElement);
    let rectangle: Types.rectangle =
      CanvasContext.getBoundingClientRect(canvasElement);

    /* Some useful reference points */
    let paddingFactorX = CanvasContext.paddingFactorX(rectangle.width);
    let paddingFactorY = CanvasContext.paddingFactorX(rectangle.height);

    let p00: Types.canvasPoint = {
      w: float_of_int(rectangle.left) +. paddingFactorX,
      h: float_of_int(rectangle.bottom) -. paddingFactorY,
    };
    let p01: Types.canvasPoint = {
      w: float_of_int(rectangle.left) +. paddingFactorX,
      h: float_of_int(rectangle.top) +. paddingFactorY,
    };
    let p10: Types.canvasPoint = {
      w: float_of_int(rectangle.right) -. paddingFactorX,
      h: float_of_int(rectangle.bottom) -. paddingFactorY,
    };
    let p11: Types.canvasPoint = {
      w: float_of_int(rectangle.right) -. paddingFactorX,
      h: float_of_int(rectangle.top) +. paddingFactorY,
    };

    /* Clear the canvas with new white sheet */
    CanvasContext.clearRect(
      context,
      ~x=0.,
      ~y=0.,
      ~w=float_of_int(rectangle.width),
      ~h=float_of_int(rectangle.height),
    );

    /* Draw a line between every two adjacent points */
    let length = Array.length(canvasShape.ws);
    let windowScrollY: float = [%raw "window.scrollY"];
    CanvasContext.setStrokeStyle(context, String, "#5680cc");
    CanvasContext.lineWidth(context, 4.);

    for (i in 1 to length - 1) {
      let point0 = Convert.getPoint(canvasShape, i - 1);
      let point1 = Convert.getPoint(canvasShape, i);

      let point0 = {...point0, h: point0.h -. windowScrollY};
      let point1 = {...point1, h: point1.h -. windowScrollY};
      line(canvasElement, ~point0, ~point1);
    };

    /* Draws the expected value line */
    // Removed on the grounds that it didn't play nice with changes in limits.
    /*
          let continuousShape =
            Convert.canvasShapeToContinuousShape(~canvasShape, ~canvasElement);
          let mean = Distributions.Continuous.T.mean(continuousShape);
          let variance = Distributions.Continuous.T.variance(continuousShape);
          let meanLocation =
            Convert.findClosestInOrderedArrayDangerously(mean, canvasShape.xValues);
          let meanLocationCanvasX = canvasShape.ws[meanLocation];
          let meanLocationCanvasY = canvasShape.hs[meanLocation];
          CanvasContext.beginPath(context);
          CanvasContext.setStrokeStyle(context, String, "#5680cc");
          CanvasContext.setLineDash(context, [|5, 10|]);

          line(
            canvasElement,
            ~point0={w: meanLocationCanvasX, h: p00.h},
            ~point1={
              w: meanLocationCanvasX,
              h: meanLocationCanvasY -. windowScrollY,
            },
          );
          CanvasContext.stroke(context);
          CanvasContext.setLineDash(context, [||]);
     */
    /* draws lines parallel to x axis + factors to help w/ precise drawing. */
    CanvasContext.beginPath(context);
    CanvasContext.setStrokeStyle(context, String, "#CCC");
    CanvasContext.lineWidth(context, 2.);
    CanvasContext.font(context, "18px Roboto");
    CanvasContext.textAlign(context, "center");

    let numLines = 8;
    let height =
      float_of_int(rectangle.height)
      *. CanvasContext.paddingRatioX
      /. float_of_int(numLines);

    for (i in 0 to numLines - 1) {
      let pLeft = {...p00, h: p00.h -. height *. float_of_int(i)};
      let pRight = {...p10, h: p10.h -. height *. float_of_int(i)};
      line(canvasElement, ~point0=pLeft, ~point1=pRight);
      CanvasContext.fillText(
        string_of_int(i) ++ "x",
        ~x=pLeft.w -. float_of_int(rectangle.left) +. 15.0,
        ~y=pLeft.h -. float_of_int(rectangle.top) -. 5.0,
        context,
      );
    };

    /* Draw a frame around the drawable area */
    CanvasContext.lineWidth(context, 2.0);
    CanvasContext.setStrokeStyle(context, String, "#000");
    line(canvasElement, ~point0=p00, ~point1=p01);
    line(canvasElement, ~point0=p01, ~point1=p11);
    line(canvasElement, ~point0=p11, ~point1=p10);
    line(canvasElement, ~point0=p10, ~point1=p00);

    /* draw units along the x axis */
    CanvasContext.font(context, "16px Roboto");
    CanvasContext.lineWidth(context, 2.0);
    let numIntervals = 10;
    let width = float_of_int(rectangle.width);
    let height = float_of_int(rectangle.height);
    let xMin = canvasShape.xValues[0];
    let xMax = canvasShape.xValues[length - 1];
    let xSpan = (xMax -. xMin) /. float_of_int(numIntervals - 1);

    for (i in 0 to numIntervals - 1) {
      let x =
        float_of_int(rectangle.left)
        +. width
        *. float_of_int(i)
        /. float_of_int(numIntervals);
      let dashValue = xMin +. xSpan *. float_of_int(i);
      CanvasContext.fillText(
        Js.Float.toFixedWithPrecision(dashValue, ~digits=2),
        ~x,
        ~y=height,
        context,
      );
      line(
        canvasElement,
        ~point0={
          w: x +. CanvasContext.paddingFactorX(rectangle.width),
          h: p00.h,
        },
        ~point1={
          w: x +. CanvasContext.paddingFactorX(rectangle.width),
          h: p00.h +. 10.0,
        },
      );
    };
  };

  let initialDistribution = (canvasElement: Dom.element, setState) => {
    let mean = 50.0;
    let stdev = 20.0;
    let numSamples = 3000;

    let normal: SymbolicDist.dist = `Normal({mean, stdev});
    let normalShape = SymbolicDist.GenericSimple.toShape(normal, numSamples);
    let xyShape: Types.xyShape =
      switch (normalShape) {
      | Mixed(_) => {xs: [||], ys: [||]}
      | Discrete(_) => {xs: [||], ys: [||]}
      | Continuous(m) => Distributions.Continuous.getShape(m)
      };

    /* // To use a lognormal instead:
       let lognormal = SymbolicDist.Lognormal.fromMeanAndStdev(mean, stdev);
       let lognormalShape =
         SymbolicDist.GenericSimple.toShape(lognormal, numSamples);
       let lognormalXYShape: Types.xyShape =
         switch (lognormalShape) {
         | Mixed(_) => {xs: [||], ys: [||]}
         | Discrete(_) => {xs: [||], ys: [||]}
         | Continuous(m) => Distributions.Continuous.getShape(m)
         };
       */

    let canvasShape = Convert.xyShapeToCanvasShape(~xyShape, ~canvasElement);
    /* let continuousShapeBack =
         Convert.canvasShapeToContinuousShape(~canvasShape, ~canvasElement);
       */

    let windowScrollY: float = [%raw "window.scrollY"];
    let canvasShape = {
      ...canvasShape,
      hs: E.A.fmap(h => h +. windowScrollY, canvasShape.hs),
    };
    setState((state: Types.canvasState) => {
      {...state, canvasShape: Some(canvasShape)}
    });

    canvasPlot(canvasElement, canvasShape);
  };
};

module ForetoldAPI = {
  let predict = (~measurableId, ~token, ~xs, ~ys, ~comment) => {
    let payload = Js.Dict.empty();
    let xsString = Js.Array.toString(xs);
    let ysString = Js.Array.toString(ys);

    let query = {j|mutation {
      measurementCreate(input: {
          value: {
          floatCdf: {
              xs: [$xsString]
              ys: [$ysString]
          }
          }
          valueText: "Drawn by hand."
          description: "$comment"
          competitorType: COMPETITIVE
          measurableId: "$measurableId"
      }) {
          id
      }
      }|j};
    Js.Dict.set(payload, "query", Js.Json.string(query));

    Js.Promise.(
      Fetch.fetchWithInit(
        "https://api.foretold.io/graphql?token=" ++ token,
        Fetch.RequestInit.make(
          ~method_=Post,
          ~body=
            Fetch.BodyInit.make(
              Js.Json.stringify(Js.Json.object_(payload)),
            ),
          ~headers=
            Fetch.HeadersInit.make({
              "Accept-Encoding": "gzip, deflate, br",
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Connection": "keep-alive",
              "DNT": "1",
              "Origin": "https://api.foretold.io",
            }),
          (),
        ),
      )
      |> then_(Fetch.Response.json)
    );
  };
};

module State = {
  type t = Types.canvasState;

  let initialState: t = {
    canvasShape: None,
    lastMousePosition: None,
    isMouseDown: false,
    readyToRender: false,
    hasJustBeenSentToForetold: false,
    limitsHaveJustBeenUpdated: false,
    foretoldFormElements: {
      measurableId: "",
      token: "",
      comment: "",
    },
    distributionLimits: {
      lower: 0.0,
      upper: 1000.0,
    },
  };

  let updateMousePosition = (~point: Types.canvasPoint, ~setState) => {
    setState((state: t) => {...state, lastMousePosition: Some(point)});
  };

  let onMouseMovement =
      (
        ~event: ReactEvent.Mouse.t,
        ~potentialCanvas: option(Dom.element),
        ~state: t,
        ~setState,
      ) => {
    /* Helper functions and objects*/
    let x = ReactEvent.Mouse.clientX(event);
    let y = ReactEvent.Mouse.clientY(event);

    let windowScrollY: float = [%raw "window.scrollY"];

    let point1: Types.canvasPoint = {
      w: float_of_int(x),
      h: float_of_int(y) +. windowScrollY,
    };

    let pointIsInBetween =
        (a: Types.canvasPoint, b: Types.canvasPoint, c: Types.canvasPoint)
        : bool => {
      let x0 = a.w;
      let x1 = b.w;
      let x2 = c.w;
      x0 < x2 && x2 < x1 || x1 < x2 && x2 < x0;
    };

    /* If all conditions are met, update the distribution */
    let updateDistWithMouseMovement =
        (
          ~point0: Types.canvasPoint,
          ~point1: Types.canvasPoint,
          ~canvasShape: Types.canvasShape,
        ) => {
      /*
       The mouse moves across the screen, and we get a series of (x,y) positions.
       We know where the mouse last was
       we update everything between the last (x,y) position and the new (x,y), using linear interpolation
       Note that we only want to update & iterate over the parts of the canvas which are changed by the mouse movement
       (otherwise, things might be too slow)
       */

      let slope = (point1.h -. point0.h) /. (point1.w -. point0.w);
      let pos0 =
        Convert.findClosestInOrderedArrayDangerously(
          point0.w,
          canvasShape.ws,
        );
      let pos1 =
        Convert.findClosestInOrderedArrayDangerously(
          point1.w,
          canvasShape.ws,
        );

      // Mouse is moving to the right
      for (i in pos0 to pos1) {
        let pointN = Convert.getPoint(canvasShape, i);
        switch (pointIsInBetween(point0, point1, pointN)) {
        | false => ()
        | true =>
          canvasShape.hs[i] = point0.h +. slope *. (pointN.w -. point0.w)
        };
      };

      // Mouse is moving to the left
      for (i in pos0 downto pos1) {
        let pointN = Convert.getPoint(canvasShape, i);
        switch (pointIsInBetween(point0, point1, pointN)) {
        | false => ()
        | true =>
          canvasShape.hs[i] = point0.h +. slope *. (pointN.w -. point0.w)
        };
      };
      canvasShape;
    };

    /* Check that the mouse movement was within the paddding box. */
    let validateYCoordinates =
        (~point: Types.canvasPoint, ~rectangle: Types.rectangle) => {
      switch (
        /*
         - If we also validate the xs, this produces a jaded user experience around the edges.
         - Instead, we will also update the first and last points in the updateDistWithMouseMovement, with the findClosestInOrderedArrayDangerously function, even when the x is outside the padding zone
         - When we send the distribution to foretold, we'll get rid of the first and last points.
         */
        /*
         point.w >= float_of_int(rectangle.left)
         +. CanvasContext.paddingFactorX(rectangle.width),
         point.w <= float_of_int(rectangle.right)
         -. CanvasContext.paddingFactorX(rectangle.width),
         */
        point.h
        -. windowScrollY >= float_of_int(rectangle.top)
        +. CanvasContext.paddingFactorY(rectangle.height),
        point.h
        -. windowScrollY <= float_of_int(rectangle.bottom)
        -. CanvasContext.paddingFactorY(rectangle.height),
      ) {
      | (true, true) => true
      | _ => false
      };
    };

    let decideWithCanvas = (~canvasElement, ~canvasShape, ~point0) => {
      let rectangle = CanvasContext.getBoundingClientRect(canvasElement);
      switch (
        validateYCoordinates(~point=point0, ~rectangle),
        validateYCoordinates(~point=point1, ~rectangle),
      ) {
      | (true, true) =>
        let newCanvasShape =
          updateDistWithMouseMovement(~point0, ~point1, ~canvasShape);
        setState((state: t) => {
          {
            ...state,
            lastMousePosition: Some(point1),
            canvasShape: Some(newCanvasShape),
            readyToRender: false,
          }
        });
        state.readyToRender
          ? Draw.canvasPlot(canvasElement, newCanvasShape) : ();

      | (false, true) => updateMousePosition(~point=point1, ~setState)
      | (_, false) => ()
      };
    };

    switch (
      potentialCanvas,
      state.canvasShape,
      state.isMouseDown,
      state.lastMousePosition,
    ) {
    | (Some(canvasElement), Some(canvasShape), true, Some(point0)) =>
      decideWithCanvas(~canvasElement, ~canvasShape, ~point0)
    | (Some(canvasElement), _, true, None) =>
      let rectangle = CanvasContext.getBoundingClientRect(canvasElement);
      validateYCoordinates(~point=point1, ~rectangle)
        ? updateMousePosition(~point=point1, ~setState) : ();
    | _ => ()
    };
  };

  let onMouseClick = (~setState, ~state) => {
    setState((state: t) => {
      {...state, isMouseDown: !state.isMouseDown, lastMousePosition: None}
    });
  };

  let onSubmitForetoldForm =
      (
        ~state: Types.canvasState,
        ~potentialCanvasElement: option(Dom.element),
        ~setState,
      ) => {
    let potentialCanvasShape = state.canvasShape;

    switch (potentialCanvasShape, potentialCanvasElement) {
    | (None, _) => ()
    | (_, None) => ()
    | (Some(canvasShape), Some(canvasElement)) =>
      let pdf =
        Convert.canvasShapeToContinuousShape(~canvasShape, ~canvasElement);

      /* create a cdf from a pdf */
      let _pdf =
        Distributions.Continuous.T.scaleToIntegralSum(
          ~cache=None,
          ~intendedSum=1.0,
          pdf,
        );
      let cdf = Distributions.Continuous.T.integral(~cache=None, _pdf);
      let xs = [||];
      let ys = [||];
      for (i in 1 to 999) {
        /*
         - see comment in validateYCoordinates as to why this starts at 1.
         - foretold accepts distributions with up to 1000 points.
         */
        let j = i * 3;
        Js.Array.push(cdf.xyShape.xs[j], xs);
        Js.Array.push(cdf.xyShape.ys[j], ys);

        ();
      };

      ForetoldAPI.predict(
        ~measurableId=state.foretoldFormElements.measurableId,
        ~token=state.foretoldFormElements.token,
        ~comment=state.foretoldFormElements.comment,
        ~xs,
        ~ys,
      );

      setState((state: t) => {...state, hasJustBeenSentToForetold: true});
      Js.Global.setTimeout(
        () => {
          setState((state: t) =>
            {...state, hasJustBeenSentToForetold: false}
          )
        },
        5000,
      );

      ();
    };
    ();
  };

  let onSubmitLimitsForm =
      (
        ~state: Types.canvasState,
        ~potentialCanvasElement: option(Dom.element),
        ~setState,
      ) => {
    let potentialCanvasShape = state.canvasShape;

    switch (potentialCanvasShape, potentialCanvasElement) {
    | (None, _) => ()
    | (_, None) => ()
    | (Some(canvasShape), Some(canvasElement)) =>
      let xValues = canvasShape.xValues;
      let length = Array.length(xValues);
      let xMin = xValues[0];
      let xMax = xValues[length - 1];
      let lower = state.distributionLimits.lower;
      let upper = state.distributionLimits.upper;

      let slope = (upper -. lower) /. (xMax -. xMin);
      let delta = lower -. slope *. xMin;

      let xValues = E.A.fmap(x => delta +. x *. slope, xValues);
      let newCanvasShape = {...canvasShape, xValues};
      setState((state: t) =>
        {
          ...state,
          canvasShape: Some(newCanvasShape),
          limitsHaveJustBeenUpdated: true,
        }
      );
      Draw.canvasPlot(canvasElement, newCanvasShape);

      Js.Global.setTimeout(
        () => {
          setState((state: t) =>
            {...state, limitsHaveJustBeenUpdated: false}
          )
        },
        5000,
      );

      ();
    };
    ();
  };
};

module Styles = {
  open Css;
  let dist = style([padding(em(1.))]);
  let spacer = style([marginTop(em(1.))]);
};

[@react.component]
let make = () => {
  let canvasRef: React.Ref.t(option(Dom.element)) = React.useRef(None); // should morally live inside the state, but this is tricky.
  let (state, setState) = React.useState(() => State.initialState);

  /* Draw the initial distribution */
  React.useEffect0(() => {
    let potentialCanvas = React.Ref.current(canvasRef);
    (
      switch (potentialCanvas) {
      | Some(canvasElement) =>
        Draw.initialDistribution(canvasElement, setState)
      | None => ()
      }
    )
    |> ignore;
    None;
  });

  /* Render the current distribution every 30ms, while the mouse is moving and changing it */
  React.useEffect0(() => {
    let runningInterval =
      Js.Global.setInterval(
        () => {
          setState((state: Types.canvasState) => {
            {...state, readyToRender: true}
          })
        },
        30,
      );
    Some(() => Js.Global.clearInterval(runningInterval));
  });

  <Antd.Card title={"Distribution Drawer" |> R.ste}>
    <div className=Styles.spacer />
    <p> {"Click to begin drawing, click to stop drawing" |> R.ste} </p>
    <canvas
      width="1000"
      height="700"
      ref={ReactDOMRe.Ref.callbackDomRef(elem =>
        React.Ref.setCurrent(canvasRef, Js.Nullable.toOption(elem))
      )}
      onMouseMove={event =>
        State.onMouseMovement(
          ~event,
          ~potentialCanvas=React.Ref.current(canvasRef),
          ~state,
          ~setState,
        )
      }
      onClick={_e => State.onMouseClick(~setState, ~state)}
    />
    <div className=Styles.spacer />
    <div className=Styles.spacer />
    <br />
    <br />
    <br />
    <Antd.Card title={"Update upper and lower limits" |> R.ste}>
      <form
        id="update-limits"
        onSubmit={(e: ReactEvent.Form.t): unit => {
          ReactEvent.Form.preventDefault(e);
          /* code to run on submit */
          State.onSubmitLimitsForm(
            ~state,
            ~potentialCanvasElement=React.Ref.current(canvasRef),
            ~setState,
          );
          ();
        }}>
        <div>
          <label> {"Lower:  " |> R.ste} </label>
          <input
            type_="number"
            id="lowerlimit"
            name="lowerlimit"
            value={Js.Float.toString(state.distributionLimits.lower)}
            placeholder="a number. f.ex., 0"
            required=true
            step=0.001
            onChange={event => {
              let value = ReactEvent.Form.target(event)##value;
              setState((state: Types.canvasState) => {
                {
                  ...state,
                  distributionLimits: {
                    ...state.distributionLimits,
                    lower: value,
                  },
                }
              });
            }}
          />
        </div>
        <br />
        <div>
          <label> {"Upper:  " |> R.ste} </label>
          <input
            type_="number"
            id="upperlimit"
            name="upperlimit"
            value={Js.Float.toString(state.distributionLimits.upper)}
            placeholder="a number. f.ex., 100"
            required=true
            step=0.001
            onChange={event => {
              let value = ReactEvent.Form.target(event)##value;
              setState((state: Types.canvasState) => {
                {
                  ...state,
                  distributionLimits: {
                    ...state.distributionLimits,
                    upper: value,
                  },
                }
              });
            }}
          />
        </div>
        <br />
        <button type_="submit" id="updatelimits">
          {"Update limits" |> R.ste}
        </button>
        <br />
        <p hidden={!state.limitsHaveJustBeenUpdated}>
          {"Updated!" |> R.ste}
        </p>
      </form>
    </Antd.Card>
    <br />
    <br />
    <br />
    <Antd.Card title={"Send to foretold" |> R.ste}>
      <form
        id="send-to-foretold"
        onSubmit={(e: ReactEvent.Form.t): unit => {
          ReactEvent.Form.preventDefault(e);
          /* code to run on submit */
          State.onSubmitForetoldForm(
            ~state,
            ~potentialCanvasElement=React.Ref.current(canvasRef),
            ~setState,
          );
          ();
        }}>
        <div>
          <label> {"MeasurableId:  " |> R.ste} </label>
          <input
            type_="text"
            id="measurableId"
            name="measurableId"
            value={state.foretoldFormElements.measurableId}
            placeholder="The last bit in the url, after the m"
            required=true
            onChange={event => {
              let value = ReactEvent.Form.target(event)##value;
              setState((state: Types.canvasState) => {
                {
                  ...state,
                  foretoldFormElements: {
                    ...state.foretoldFormElements,
                    measurableId: value,
                  },
                }
              });
            }}
          />
        </div>
        <br />
        <div>
          <label> {"Foretold bot token: " |> R.ste} </label>
          <input
            type_="text"
            id="foretoldToken"
            name="foretoldToken"
            value={state.foretoldFormElements.token}
            placeholder="Profile -> Bots -> (New Bot) -> Token"
            required=true
            onChange={event => {
              let value = ReactEvent.Form.target(event)##value;
              setState((state: Types.canvasState) => {
                {
                  ...state,
                  foretoldFormElements: {
                    ...state.foretoldFormElements,
                    token: value,
                  },
                }
              });
            }}
          />
        </div>
        <br />
        <textarea
          id="comment"
          name="comment"
          rows=20
          cols=70
          placeholder="Explain a little bit what this distribution is about"
          onChange={event => {
            let value = ReactEvent.Form.target(event)##value;
            setState((state: Types.canvasState) => {
              {
                ...state,
                foretoldFormElements: {
                  ...state.foretoldFormElements,
                  comment: value,
                },
              }
            });
          }}
        />
        <br />
        <button type_="submit" id="sendToForetoldButton">
          {"Send to foretold" |> R.ste}
        </button>
        <br />
        <p hidden={!state.hasJustBeenSentToForetold}> {"Sent!" |> R.ste} </p>
      </form>
    </Antd.Card>
  </Antd.Card>;
};