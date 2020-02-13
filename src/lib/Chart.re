[@react.component]
let make =
    (
      ~data,
      ~minX=None,
      ~maxX=None,
      ~width=300,
      ~height=50,
      ~color=`hex("7e9db7"),
    ) =>
  <ForetoldComponents.CdfChart__Base
    width=0
    height
    ?minX
    ?maxX
    marginBottom=20
    showVerticalLine=false
    showDistributionLines=false
    primaryDistribution=data
  />;