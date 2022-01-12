open FC;
open Button;

let clear = Css.(style([clear(`both)]));
let button = Css.(style([margin(`em(0.5))]));

let render = () =>
  <>
    <div> "Secondary"->React.string </div>
    <div>
      <Button size=MediumShort className=button>
        "Small Button"->React.string
      </Button>
      <Button size=Medium className=button>
        "Medium Button"->React.string
      </Button>
      <Button size=Large className=button>
        "Large Button"->React.string
      </Button>
    </div>
    <div className=clear />
    <div> "Primary"->React.string </div>
    <div>
      <Button size=MediumShort variant=Primary className=button>
        "Small Button"->React.string
      </Button>
      <Button size=Medium variant=Primary className=button>
        "Medium Button"->React.string
      </Button>
      <Button size=Large variant=Primary className=button>
        "Large Button"->React.string
      </Button>
    </div>
  </>;

let entry = EntryTypes.(entry(~title="Buttons", ~render));