import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry/LogRocket etc.
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: '32px' }}>
              error
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-3">
            Something went wrong
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted mb-8 leading-relaxed">
            An unexpected error occurred. Please refresh the page or go back to the dashboard.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="text-left text-xs bg-surface-container-low border border-border-light rounded-xl p-4 mb-6 overflow-auto text-error font-mono">
              {this.state.error.toString()}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border-light bg-surface-white text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
              Refresh Page
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
