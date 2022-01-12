open Base;
open FC;
let make =
  <Div>
    <AppHeader
      links={
        [|
          <Link
            isDisabled=false
            className=Css.(
              style([
                marginRight(`em(2.)),
                color(Settings.Text.LightBackground.main),
                hover([color(Settings.Text.LightBackground.main)]),
              ])
            )
            href="#">
            {"Public Groups" |> ReasonReact.string}
          </Link>,
          <Link
            isDisabled=false
            className=Css.(
              style([
                marginRight(`em(2.)),
                color(Settings.Text.LightBackground.main),
                hover([color(Settings.Text.LightBackground.main)]),
              ])
            )
            href="#">
            {"Entity Explorer" |> ReasonReact.string}
          </Link>,
        |]
        |> ReasonReact.array
      }
    />
    Example__AppGroupHeader.make
    <Div
      styles=[
        Css.(
          style(
            [
              marginTop(`em(1.)),
              width(`percent(100.)),
              paddingLeft(`em(2.)),
              paddingRight(`em(2.)),
            ]
            @ BaseStyles.fullWidthFloatLeft,
          )
        ),
      ]>
      Example__MeasurableIndexPage.make
    </Div>
    <Div
      styles=[
        Css.(
          style(
            [
              marginTop(`em(1.)),
              width(`percent(100.)),
              paddingLeft(`em(2.)),
              paddingRight(`em(2.)),
              boxSizing(`borderBox),
            ]
            @ BaseStyles.fullWidthFloatLeft,
          )
        ),
      ]>
      <Div flexDirection=`row>
        <Div
          flex={`num(5.0)} styles=[Css.(style([paddingRight(`em(2.0))]))]>
          <Div> Example__MeasurableTopCard.make </Div>
          <Div
            styles=[
              Css.(
                style(
                  [marginTop(`em(1.0))] @ BaseStyles.fullWidthFloatLeft,
                )
              ),
            ]>
            Example__CardMeasurableMeasurements.make
          </Div>
        </Div>
        <Div flex={`num(2.0)}>
          Example__MeasurableTopCard.make
          <Div styles=[Css.(style([clear(`both), paddingTop(`em(1.0))]))]>
            <MeasurableForm cdf=ExampleCdfs.Example1.cdf />
          </Div>
        </Div>
      </Div>
    </Div>
    <Div
      styles=[
        Css.(
          style(
            [
              marginTop(`em(2.)),
              width(`percent(100.)),
              paddingLeft(`em(2.)),
              paddingRight(`em(2.)),
              boxSizing(`borderBox),
            ]
            @ BaseStyles.fullWidthFloatLeft,
          )
        ),
      ]>
      <Div flexDirection=`row>
        <Div
          flex={`num(5.0)} styles=[Css.(style([paddingRight(`em(2.0))]))]>
          <Div> Example__MemberTableCard.make </Div>
        </Div>
        <Div flex={`num(2.0)} />
      </Div>
    </Div>
    <Footer
      logo={React.string({js|2019 \u00a9 Foretold|js})}
      links=[|
        <a href="#"> {React.string("About")} </a>,
        <a href="#"> {React.string("Help")} </a>,
        <a href="#"> {React.string("Documentation")} </a>,
        <a href="#"> {React.string("Privacy Policy")} </a>,
        <a href="#"> {React.string("Terms of Service")} </a>,
      |]
    />
  </Div>;
