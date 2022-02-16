@module("lodash") external min: array<'a> => 'a = "min"
@module("lodash") external max: array<'a> => 'a = "max"
@module("lodash") external uniq: array<'a> => array<'a> = "uniq"
@module("lodash")
external countBy: (array<'a>, 'a => 'b) => Js.Dict.t<int> = "countBy"
