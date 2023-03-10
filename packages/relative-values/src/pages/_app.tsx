import "../styles/main.css";
import "@quri/squiggle-components/dist/main.css";
import { AppProps } from "next/app";

const App = ({ Component }: AppProps) => (
  <div className="squiggle-relative-values">
    <Component />
  </div>
);
export default App;
