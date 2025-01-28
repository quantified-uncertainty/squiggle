import '../styles/main.css';
import 'react-loading-skeleton/dist/skeleton.css';

import { PropsWithChildren } from 'react';

import { Metadata } from 'next';
import PlausibleProvider from 'next-plausible';

import { Root } from './Root';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html>
      <head>
        <PlausibleProvider domain="metaforecast.org" />
      </head>
      <body>
        <Root>{children}</Root>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Metaforecast",
};
