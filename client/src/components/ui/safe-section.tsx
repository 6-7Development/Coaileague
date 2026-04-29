import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; name?: string; }
interface State { hasError: boolean; error?: Error; }

/**
 * Lightweight inline error boundary — prevents sub-component crashes
 * from propagating to the entire dashboard/page.
 * Usage: <SafeSection name="MetricCards"><YourComponent /></SafeSection>
 */
export class SafeSection extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[SafeSection:${this.props.name ?? 'unknown'}] Caught:`, error.message, info.componentStack?.slice(0, 200));
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium">Section temporarily unavailable</p>
          <p className="text-xs mt-1 opacity-70">{this.state.error?.message?.slice(0, 120)}</p>
          <button 
            className="mt-2 text-xs underline" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SafeSection;
