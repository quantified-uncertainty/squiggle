type content = {
  headerContent: ReasonReact.reactElement,
  bodyContent: ReasonReact.reactElement,
};

module Overlay = {
  module Styles = {
    open Css;
    let className = style([maxWidth(`em(30.))]);
  };

  [@react.component]
  let make = (~content) =>
    <div className=Styles.className>
      <PageCard>
        <PageCard.HeaderRow>
          <Div float=`left>
            <PageCard.HeaderRow.Title>
              <span className=Css.(style([marginRight(`em(0.4))]))>
                <Icon.Questionmark isInteractive=false />
              </span>
              {content.headerContent}
            </PageCard.HeaderRow.Title>
          </Div>
        </PageCard.HeaderRow>
        <PageCard.Body>
          <PageCard.BodyPadding v={`em(0.5)}>
            <span
              className=Css.(
                style([
                  color(Settings.Text.LightBackground.p),
                  lineHeight(`em(1.5)),
                ])
              )>
              {content.bodyContent}
            </span>
          </PageCard.BodyPadding>
        </PageCard.Body>
      </PageCard>
    </div>;
};

[@react.component]
let make = (~content) =>
  <Dropdown overlay={<Overlay content />} trigger=Dropdown.Hover>
    <span> <Icon.Questionmark isInteractive=true /> </span>
  </Dropdown>;