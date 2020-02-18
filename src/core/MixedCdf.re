type t = DistributionTypes.mixedShape;

type yPdfPoint = {
  continuous: float,
  discrete: float,
};

let getY = (t: t, x: float): yPdfPoint => {
  continuous: Shape.Continuous.findY(x, t.continuous),
  discrete: Shape.Discrete.findY(x, t.discrete),
} /*   discrete: Shape.Discrete.findY(x, t.discrete)*/;

// let getIntegralY = (t: t, x: float): float => {
//   continuous: Shape.Continuous.findY(x, t.continuous),