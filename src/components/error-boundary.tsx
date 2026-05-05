import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label included in console output to make crashes easy to find. */
  name?: string;
  /** When true, swallows the error silently (renders fallback only). */
  silent?: boolean;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface for diagnostics; never crash the page.
    const label = this.props.name ? `[${this.props.name}]` : "";
    // eslint-disable-next-line no-console
    console.error(
      `ErrorBoundary${label} caught:`,
      error,
      info?.componentStack,
    );
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      if (this.props.silent) return null;
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Something went wrong loading this section.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Please refresh the page. If this keeps happening, try again in a
            moment.
          </p>
          <a
            href="https://www.poolrentalnearme.com/s" target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Browse pools →
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
