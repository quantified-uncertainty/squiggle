"use client";

import { Component, PropsWithChildren } from "react";

type State = {
  error?: Error;
};

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  public override state: State = {};

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch() {}

  public override render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl mt-4 p-4 bg-red-400 rounded">
          <header className="mb-2">Error</header>
          <div className="mb-2">{this.state.error.message}</div>
          <pre className="text-xs overflow-auto">{this.state.error.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
