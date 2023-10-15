"use client";

import { Component, PropsWithChildren } from "react";

type State = {
  error?: Error;
};

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  public state: State = {};

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch() {}

  public render() {
    if (this.state.error) {
      return (
        <div className="m-2 p-4 bg-red-300 rounded">
          <header className="mb-2 font-semibold">Fatal Error</header>
          <div className="mb-2">{this.state.error.message}</div>
          <div className="mb-2">Try reloading the browser.</div>
          <pre className="text-xs overflow-auto">{this.state.error.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
