import React, {
  FC,
  PropsWithChildren,
} from 'react';

import Link from 'next/link';

import { ErrorBoundary } from '../../web/common/ErrorBoundary';
import { Logo2 } from '../../web/icons';
import { NavMenu } from './NavMenu';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  // The correct way to do this would be by passing a prop to Layout,
  // and to get the last updating using server side props.

  return (
    <div>
      <div>
        <nav className="bg-white shadow">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex gap-8">
                <Link
                  href="/"
                  className="no-underline font-md flex gap-2 items-center"
                >
                  <Logo2 className="h-8 w-8" />
                  <span className="text-sm sm:text-2xl text-gray-700">
                    Metaforecast
                  </span>
                </Link>
                <Link
                  href="/status"
                  className="hidden sm:block no-underline text-sm text-slate-400 hover:text-slate-900 self-baseline mt-1.5 sm:mt-2.5"
                >
                  Status
                </Link>
              </div>

              <NavMenu />
            </div>
          </div>
        </nav>
        <main>
          <ErrorBoundary>
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 mb-10">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
