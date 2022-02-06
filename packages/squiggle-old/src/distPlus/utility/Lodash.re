[@bs.module "lodash"] external min: array('a) => 'a = "min";
[@bs.module "lodash"] external max: array('a) => 'a = "max";
[@bs.module "lodash"] external uniq: array('a) => array('a) = "uniq";
[@bs.module "lodash"]
external countBy: (array('a), 'a => 'b) => Js.Dict.t(int) = "countBy";