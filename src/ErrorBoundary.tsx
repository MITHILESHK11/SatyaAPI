import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-800 rounded-xl shadow-2xl p-6 border border-red-500/20">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Something went wrong</h2>
            <div className="bg-zinc-950 p-4 rounded-lg overflow-auto max-h-64 text-sm text-zinc-300 font-mono">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
