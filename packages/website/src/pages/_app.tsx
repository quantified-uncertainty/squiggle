import type { AppProps } from "next/app";

import "@quri/squiggle-components/common.css";
import "../styles/main.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
