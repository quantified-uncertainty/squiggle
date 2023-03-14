import "../styles/main.css";
import "@quri/squiggle-components/dist/main.css";
import { AppProps } from "next/app";
import { Tailwind } from "@/components/Tailwind";

const App = ({ Component }: AppProps) => (
  <Tailwind>
    <Component />
  </Tailwind>
);
export default App;
